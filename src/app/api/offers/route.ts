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

// GET /api/offers?type=received|sent — offers on my listings (default), or offers I made
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const where =
      searchParams.get("type") === "sent" ? { buyerId: currentUserId } : { sellerId: currentUserId }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          listing: { select: listingSummarySelect },
          buyer: { select: userSummarySelect },
          seller: { select: userSummarySelect },
        },
      }),
      prisma.offer.count({ where }),
    ])

    return successResponse(offers, undefined, getPaginationMeta(total, page, limit))
  } catch (error) {
    return internalErrorResponse(error)
  }
}
