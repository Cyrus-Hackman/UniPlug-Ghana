import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId, createNotification } from "@/lib/helpers"

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/listings/[id]/borrow
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: listingId } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { id: true, profile: { select: { fullName: true } } } } },
    })

    if (!listing) return notFoundResponse("Listing")
    if (listing.sellerId === currentUserId) {
      return errorResponse("You cannot borrow your own listing.", 400)
    }
    if (listing.type !== "LEND") {
      return errorResponse("This listing is not available for lending.", 400)
    }
    if (listing.status !== "ACTIVE") {
      return errorResponse("This listing is not currently available.", 400)
    }

    const body = await req.json()
    const { startDate, endDate, message } = body

    if (!startDate || !endDate) {
      return errorResponse("Please provide both start and end dates.", 400)
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) return errorResponse("End date must be after start date.", 400)
    if (start < new Date()) return errorResponse("Start date must be in the future.", 400)

    // Check max lending duration
    if (listing.maxLendingDays) {
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (days > listing.maxLendingDays) {
        return errorResponse(`Maximum lending duration is ${listing.maxLendingDays} days.`, 400)
      }
    }

    // Check for overlapping active requests
    const overlap = await prisma.borrowingRequest.findFirst({
      where: {
        listingId,
        status: { in: ["APPROVED", "ACTIVE"] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    })

    if (overlap) {
      return errorResponse("This item is already reserved for the selected dates.", 409)
    }

    // Calculate total price
    let totalPrice: number | null = null
    if (listing.dailyRate) {
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      totalPrice = listing.dailyRate * days
    }

    const request = await prisma.borrowingRequest.create({
      data: {
        listingId,
        borrowerId: currentUserId,
        lenderId: listing.sellerId,
        startDate: start,
        endDate: end,
        message: message || null,
        totalPrice,
        status: "PENDING",
      },
    })

    // Notify lender
    const borrowerProfile = await prisma.profile.findUnique({
      where: { userId: currentUserId },
      select: { fullName: true },
    })

    await createNotification({
      userId: listing.sellerId,
      type: "BORROW_REQUEST",
      title: "New borrowing request",
      body: `${borrowerProfile?.fullName || "Someone"} wants to borrow "${listing.title}" from ${formatDate(start)} to ${formatDate(end)}.`,
      link: `/borrowings`,
      metadata: { requestId: request.id, listingId },
    })

    return successResponse(request, "Borrowing request sent!", undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GH", { day: "numeric", month: "short" })
}
