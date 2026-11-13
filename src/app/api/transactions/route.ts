import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
  getPaginationParams,
  getPaginationMeta,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"
import { listingSummarySelect, userSummarySelect } from "@/lib/prisma-selects"

// GET /api/transactions?type=purchases|sales — deals where I'm the buyer/borrower
// (default) or the seller/lender
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const where =
      searchParams.get("type") === "sales" ? { sellerId: currentUserId } : { buyerId: currentUserId }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          listing: { select: listingSummarySelect },
          buyer: { select: userSummarySelect },
          seller: { select: userSummarySelect },
          // Only my own review, to tell whether I've already left one
          reviews: { where: { reviewerId: currentUserId }, select: { id: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    const data = transactions.map(({ reviews, ...transaction }) => ({
      ...transaction,
      hasReviewed: reviews.length > 0,
    }))

    return successResponse(data, undefined, getPaginationMeta(total, page, limit))
  } catch (error) {
    return internalErrorResponse(error)
  }
}
