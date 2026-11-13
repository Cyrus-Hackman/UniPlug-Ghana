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

// GET /api/borrowings?type=borrowed|lent — requests I made (default), or requests for my items
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const where =
      searchParams.get("type") === "lent" ? { lenderId: currentUserId } : { borrowerId: currentUserId }

    const [borrowings, total] = await Promise.all([
      prisma.borrowingRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          listing: {
            select: { ...listingSummarySelect, dailyRate: true, weeklyRate: true, deposit: true },
          },
          lender: { select: userSummarySelect },
          borrower: { select: userSummarySelect },
        },
      }),
      prisma.borrowingRequest.count({ where }),
    ])

    // Derived here because nothing marks requests OVERDUE in the database yet
    const now = Date.now()
    const data = borrowings.map((b) => ({
      ...b,
      isOverdue: b.status === "OVERDUE" || (b.status === "ACTIVE" && b.endDate.getTime() < now),
    }))

    return successResponse(data, undefined, getPaginationMeta(total, page, limit))
  } catch (error) {
    return internalErrorResponse(error)
  }
}
