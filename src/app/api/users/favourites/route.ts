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
import { listingCardInclude } from "@/lib/prisma-selects"

// GET /api/users/favourites — my saved listings, most recently saved first
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    // Hide listings the seller deleted; sold/reserved ones stay so people can see what happened
    const where = { userId: currentUserId, listing: { deletedAt: null } }

    const [favourites, total] = await Promise.all([
      prisma.favourite.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { listing: { include: listingCardInclude } },
      }),
      prisma.favourite.count({ where }),
    ])

    const listings = favourites.map((f) => ({ ...f.listing, isFavourited: true }))
    return successResponse(listings, undefined, getPaginationMeta(total, page, limit))
  } catch (error) {
    return internalErrorResponse(error)
  }
}
