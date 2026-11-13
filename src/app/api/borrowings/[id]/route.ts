import { NextRequest } from "next/server"
import { z } from "zod"
import type { BorrowingStatus, Prisma, TransactionStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
  ConflictError,
  conflictResponse,
} from "@/lib/api-response"
import { getCurrentUserId, createNotification } from "@/lib/helpers"
import { formatDate } from "@/lib/utils"

interface Params {
  params: Promise<{ id: string }>
}

const bodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "ACTIVE", "RETURNED", "CANCELLED"]),
})

type Target = z.infer<typeof bodySchema>["status"]
type Role = "lender" | "borrower"

// Who may move a request to each status, and from which current statuses.
// Happy path: PENDING → APPROVED → ACTIVE (handed over) → RETURNED.
const TRANSITIONS: Record<Target, Partial<Record<Role, BorrowingStatus[]>>> = {
  APPROVED: { lender: ["PENDING"] },
  REJECTED: { lender: ["PENDING"] },
  ACTIVE: { lender: ["APPROVED"] },
  // The lender confirms, since they're the one who gets the item back
  RETURNED: { lender: ["ACTIVE", "OVERDUE"] },
  CANCELLED: { borrower: ["PENDING", "APPROVED"], lender: ["APPROVED"] },
}

const VERBS: Record<Target, string> = {
  APPROVED: "approved",
  REJECTED: "declined",
  ACTIVE: "marked as handed over",
  RETURNED: "marked as returned",
  CANCELLED: "cancelled",
}

// Requests that hold the item for their dates
const BOOKED_STATUSES: BorrowingStatus[] = ["APPROVED", "ACTIVE", "OVERDUE"]
const OPEN_DEAL_STATUSES: TransactionStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS"]

type NotificationInput = Parameters<typeof createNotification>[0]

// Other requests for the same item whose dates overlap this one
function overlapsWith(request: { id: string; listingId: string; startDate: Date; endDate: Date }) {
  return {
    listingId: request.listingId,
    id: { not: request.id },
    startDate: { lte: request.endDate },
    endDate: { gte: request.startDate },
  } satisfies Prisma.BorrowingRequestWhereInput
}

// Conditional update: only applies if the request is still in an allowed status,
// so double-clicks or both parties acting at once can't apply a transition twice.
async function moveStatus(
  tx: Prisma.TransactionClient,
  id: string,
  from: BorrowingStatus[],
  data: Prisma.BorrowingRequestUpdateManyMutationInput
) {
  const { count } = await tx.borrowingRequest.updateMany({ where: { id, status: { in: from } }, data })
  if (count === 0) {
    throw new ConflictError("This request was just updated. Refresh the page and try again.")
  }
}

// PATCH /api/borrowings/[id] — move a borrowing request through its lifecycle
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return errorResponse("Invalid action.", 400)
    const target = parsed.data.status

    const request = await prisma.borrowingRequest.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true, deletedAt: true } },
        lender: { select: { profile: { select: { fullName: true } } } },
        borrower: { select: { profile: { select: { fullName: true } } } },
      },
    })
    if (!request) return notFoundResponse("Borrowing request")

    const role: Role | null =
      request.lenderId === currentUserId
        ? "lender"
        : request.borrowerId === currentUserId
          ? "borrower"
          : null
    if (!role) return forbiddenResponse()

    const allowedFrom = TRANSITIONS[target][role]
    if (!allowedFrom) {
      return forbiddenResponse(`Only the ${role === "lender" ? "borrower" : "lender"} can do that.`)
    }
    if (!allowedFrom.includes(request.status)) {
      return conflictResponse(
        `This request is ${request.status.toLowerCase()} and can't be ${VERBS[target]}.`
      )
    }

    const now = new Date()
    const title = request.listing.title
    const lenderName = request.lender.profile?.fullName || "The lender"
    const borrowerName = request.borrower.profile?.fullName || "The borrower"
    const dates = `${formatDate(request.startDate)} – ${formatDate(request.endDate)}`
    const metadata = { requestId: id, listingId: request.listingId }

    // Notifications are sent only after the database changes have committed
    const notifications: NotificationInput[] = []
    const respond = async (message: string) => {
      await Promise.all(notifications.map((n) => createNotification(n)))
      return successResponse({ id, status: target }, message)
    }

    switch (target) {
      case "APPROVED": {
        if (request.listing.deletedAt) return errorResponse("This listing has been removed.", 400)
        if (request.endDate <= now) {
          return errorResponse("The requested dates have already passed.", 400)
        }

        const declined = await prisma.$transaction(async (tx) => {
          // Lock the listing row so two approvals for the same item can't both pass the clash check
          await tx.$queryRaw`SELECT id FROM "listings" WHERE id = ${request.listingId} FOR UPDATE`

          const clash = await tx.borrowingRequest.findFirst({
            where: { ...overlapsWith(request), status: { in: BOOKED_STATUSES } },
            select: { id: true },
          })
          if (clash) throw new ConflictError("The item is already booked for some of these dates.")

          await moveStatus(tx, id, allowedFrom, { status: "APPROVED" })

          // The linked deal shows up in both people's transactions, and lets them
          // review each other once the item comes back
          await tx.transaction.create({
            data: {
              listingId: request.listingId,
              buyerId: request.borrowerId,
              sellerId: request.lenderId,
              borrowingRequestId: id,
              type: "BORROW",
              status: "ACCEPTED",
              amount: request.totalPrice,
            },
          })

          // Those dates are taken now: decline other pending requests that overlap them
          const overlapping = await tx.borrowingRequest.findMany({
            where: { ...overlapsWith(request), status: "PENDING" },
            select: { id: true, borrowerId: true },
          })
          if (overlapping.length > 0) {
            await tx.borrowingRequest.updateMany({
              where: { id: { in: overlapping.map((r) => r.id) }, status: "PENDING" },
              data: { status: "REJECTED" },
            })
          }
          return overlapping
        })

        notifications.push({
          userId: request.borrowerId,
          type: "BORROW_APPROVED",
          title: "Borrowing request approved ✅",
          body: `${lenderName} approved your request to borrow "${title}" (${dates}). Message them to arrange pickup.`,
          link: "/borrowings",
          metadata,
        })
        for (const other of declined) {
          notifications.push({
            userId: other.borrowerId,
            type: "BORROW_REJECTED",
            title: "Borrowing request declined",
            body: `"${title}" was booked by someone else for some of the dates you asked for.`,
            link: "/borrowings",
            metadata: { requestId: other.id, listingId: request.listingId },
          })
        }

        return respond(
          declined.length > 0
            ? `Request approved. ${declined.length} overlapping request${declined.length === 1 ? " was" : "s were"} declined automatically.`
            : "Request approved. The borrower has been notified."
        )
      }

      case "REJECTED": {
        await moveStatus(prisma, id, allowedFrom, { status: "REJECTED" })
        notifications.push({
          userId: request.borrowerId,
          type: "BORROW_REJECTED",
          title: "Borrowing request declined",
          body: `${lenderName} declined your request to borrow "${title}" (${dates}).`,
          link: "/borrowings",
          metadata,
        })
        return respond("Request declined.")
      }

      case "ACTIVE": {
        await prisma.$transaction(async (tx) => {
          await moveStatus(tx, id, allowedFrom, { status: "ACTIVE" })
          await tx.transaction.updateMany({
            where: { borrowingRequestId: id, status: { in: ["PENDING", "ACCEPTED"] } },
            data: { status: "IN_PROGRESS" },
          })
          // Out on loan: new borrow requests are paused until it comes back
          await tx.listing.updateMany({
            where: { id: request.listingId, status: "ACTIVE" },
            data: { status: "BORROWED" },
          })
        })
        notifications.push({
          userId: request.borrowerId,
          type: "RETURN_REMINDER",
          title: "Borrowing started",
          body: `Enjoy "${title}"! Please return it to ${lenderName} by ${formatDate(request.endDate)}.`,
          link: "/borrowings",
          metadata,
        })
        return respond("Marked as handed over.")
      }

      case "RETURNED": {
        await prisma.$transaction(async (tx) => {
          await moveStatus(tx, id, allowedFrom, { status: "RETURNED", returnedAt: now })

          // Completing the linked deal is what lets both sides leave a review.
          // Upsert so requests approved before deals were linked still get one.
          await tx.transaction.upsert({
            where: { borrowingRequestId: id },
            create: {
              listingId: request.listingId,
              buyerId: request.borrowerId,
              sellerId: request.lenderId,
              borrowingRequestId: id,
              type: "BORROW",
              status: "COMPLETED",
              amount: request.totalPrice,
              completedAt: now,
            },
            update: { status: "COMPLETED", completedAt: now },
          })

          // Back on the market, unless another borrowing of it is still out
          const stillOut = await tx.borrowingRequest.count({
            where: {
              listingId: request.listingId,
              id: { not: id },
              status: { in: ["ACTIVE", "OVERDUE"] },
            },
          })
          if (stillOut === 0) {
            await tx.listing.updateMany({
              where: { id: request.listingId, status: "BORROWED" },
              data: { status: "ACTIVE" },
            })
          }

          await tx.profile.updateMany({
            where: { userId: { in: [request.borrowerId, request.lenderId] } },
            data: { completedTransactions: { increment: 1 } },
          })
        })
        notifications.push({
          userId: request.borrowerId,
          type: "RETURN_REMINDER",
          title: "Return confirmed",
          body: `${lenderName} confirmed you returned "${title}". You can now leave them a review.`,
          link: "/transactions",
          metadata,
        })
        return respond("Return confirmed. You can now leave a review from Transactions.")
      }

      case "CANCELLED": {
        await prisma.$transaction(async (tx) => {
          await moveStatus(tx, id, allowedFrom, { status: "CANCELLED" })
          await tx.transaction.updateMany({
            where: { borrowingRequestId: id, status: { in: OPEN_DEAL_STATUSES } },
            data: { status: "CANCELLED", cancelledAt: now },
          })
        })
        notifications.push({
          userId: role === "lender" ? request.borrowerId : request.lenderId,
          type: "BORROW_REJECTED",
          title: "Borrowing cancelled",
          body: `${role === "lender" ? lenderName : borrowerName} cancelled the borrowing of "${title}" (${dates}).`,
          link: "/borrowings",
          metadata,
        })
        return respond("Borrowing cancelled.")
      }
    }
  } catch (error) {
    if (error instanceof ConflictError) return conflictResponse(error.message)
    return internalErrorResponse(error)
  }
}
