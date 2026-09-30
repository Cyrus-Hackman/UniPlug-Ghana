import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/listings/[id]/favourite — toggle favourite
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: listingId } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    })
    if (!listing) return notFoundResponse("Listing")

    // Check if already favourited
    const existing = await prisma.favourite.findUnique({
      where: { userId_listingId: { userId: currentUserId, listingId } },
    })

    if (existing) {
      // Remove favourite
      await prisma.favourite.delete({
        where: { userId_listingId: { userId: currentUserId, listingId } },
      })
      return successResponse({ isFavourited: false }, "Removed from favourites.")
    } else {
      // Add favourite
      await prisma.favourite.create({
        data: { userId: currentUserId, listingId },
      })
      return successResponse({ isFavourited: true }, "Added to favourites!")
    }
  } catch (error) {
    return internalErrorResponse(error)
  }
}
