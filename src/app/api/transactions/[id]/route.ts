import { NextRequest } from "next/server"
import { z } from "zod"
import type { TransactionStatus } from "@prisma/client"
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

interface Params {
  params: Promise<{ id: string }>
}

const bodySchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]),
})

// A deal can only be completed or cancelled while it's still open
const OPEN_STATUSES: TransactionStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS"]

const STALE_MESSAGE = "This deal was just updated. Refresh the page and try again."

// PATCH /api/transactions/[id] — the buyer confirms they received the item (COMPLETED),
// or either party cancels (CANCELLED)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return errorResponse("Invalid action.", 400)
    const target = parsed.data.status

    const deal = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { profile: { select: { fullName: true } } } },
        seller: { select: { profile: { select: { fullName: true } } } },
      },
    })
    if (!deal) return notFoundResponse("Transaction")

    const isBuyer = deal.buyerId === currentUserId
    const isSeller = deal.sellerId === currentUserId
    if (!isBuyer && !isSeller) return forbiddenResponse()

    // Borrowing deals follow the borrowing lifecycle (approve → hand over → return)
    if (deal.type === "BORROW") {
      return errorResponse("Borrowing deals are updated from the Borrowings page.", 400)
    }
    if (!OPEN_STATUSES.includes(deal.status)) {
      return conflictResponse(`This deal is already ${deal.status.toLowerCase()}.`)
    }

    const now = new Date()
    const buyerName = deal.buyer.profile?.fullName || "The buyer"
    const sellerName = deal.seller.profile?.fullName || "The seller"

    if (target === "COMPLETED") {
      // The buyer is the one who knows the item actually changed hands
      if (!isBuyer) return forbiddenResponse("Only the buyer can confirm they received the item.")

      await prisma.$transaction(async (tx) => {
        // Conditional update: a double-click can't complete the deal (and count it) twice
        const { count } = await tx.transaction.updateMany({
          where: { id, status: { in: OPEN_STATUSES } },
          data: { status: "COMPLETED", completedAt: now },
        })
        if (count === 0) throw new ConflictError(STALE_MESSAGE)

        await tx.listing.updateMany({
          where: { id: deal.listingId, status: { in: ["ACTIVE", "RESERVED"] } },
          data: { status: "SOLD" },
        })
        await tx.profile.updateMany({
          where: { userId: { in: [deal.buyerId, deal.sellerId] } },
          data: { completedTransactions: { increment: 1 } },
        })
      })

      await createNotification({
        userId: deal.sellerId,
        type: "LISTING_SOLD",
        title: "Sale completed 🎉",
        body: `${buyerName} confirmed they received "${deal.listing.title}". You can now leave them a review.`,
        link: "/transactions",
        metadata: { transactionId: id, listingId: deal.listingId },
      })

      return successResponse({ id, status: "COMPLETED" }, "Deal completed! You can now leave a review.")
    }

    // CANCELLED: either party, while the deal is open
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.transaction.updateMany({
        where: { id, status: { in: OPEN_STATUSES } },
        data: { status: "CANCELLED", cancelledAt: now },
      })
      if (count === 0) throw new ConflictError(STALE_MESSAGE)

      // Put the item back on the market, unless another deal for it is still open
      const otherOpenDeals = await tx.transaction.count({
        where: { listingId: deal.listingId, id: { not: id }, status: { in: OPEN_STATUSES } },
      })
      if (otherOpenDeals === 0) {
        await tx.listing.updateMany({
          where: { id: deal.listingId, status: "RESERVED" },
          data: { status: "ACTIVE" },
        })
      }
    })

    await createNotification({
      userId: isBuyer ? deal.sellerId : deal.buyerId,
      type: "OFFER_REJECTED",
      title: "Deal cancelled",
      body: `${isBuyer ? buyerName : sellerName} cancelled the deal for "${deal.listing.title}".`,
      link: "/transactions",
      metadata: { transactionId: id, listingId: deal.listingId },
    })

    return successResponse({ id, status: "CANCELLED" }, "Deal cancelled.")
  } catch (error) {
    if (error instanceof ConflictError) return conflictResponse(error.message)
    return internalErrorResponse(error)
  }
}
