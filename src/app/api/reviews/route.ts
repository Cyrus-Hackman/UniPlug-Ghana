import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

// POST /api/reviews — create a review
export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const body = await req.json()
    const { transactionId, rating, comment, reviewType } = body

    if (!transactionId) return errorResponse("Transaction ID required.", 400)
    if (!rating || rating < 1 || rating > 5) {
      return errorResponse("Rating must be between 1 and 5.", 400)
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
      },
    })

    if (!transaction) return notFoundResponse("Transaction")
    if (transaction.status !== "COMPLETED") {
      return errorResponse("You can only review completed transactions.", 400)
    }

    const isBuyer = transaction.buyerId === currentUserId
    const isSeller = transaction.sellerId === currentUserId

    if (!isBuyer && !isSeller) {
      return errorResponse("You are not a participant in this transaction.", 403)
    }

    const revieweeId = isBuyer ? transaction.sellerId : transaction.buyerId

    // Check for duplicate review
    const existing = await prisma.review.findFirst({
      where: { transactionId, reviewerId: currentUserId },
    })

    if (existing) return errorResponse("You have already reviewed this transaction.", 409)

    const review = await prisma.review.create({
      data: {
        transactionId,
        reviewerId: currentUserId,
        revieweeId,
        rating,
        comment: comment?.trim() || null,
      },
    })

    // Update reviewer's average rating
    const allRatings = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await prisma.profile.update({
      where: { userId: revieweeId },
      data: {
        averageRating: allRatings._avg.rating || 0,
        ratingCount: allRatings._count.rating,
      },
    })

    // Notify the reviewee
    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: "NEW_REVIEW",
        title: "New review received",
        body: `You received a ${rating}-star review.`,
        link: `/user/${revieweeId}`,
        metadata: { reviewId: review.id } as any,
      },
    })

    return successResponse(review, "Review submitted!", undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
