import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

// POST /api/listings/images — add image to a listing
export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const body = await req.json()
    const { listingId, url, isPrimary, sortOrder } = body

    if (!listingId || !url) return errorResponse("Missing listingId or url.")

    // Verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })

    if (!listing) return errorResponse("Listing not found.", 404)
    if (listing.sellerId !== currentUserId) {
      const user = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true } })
      if (user?.role !== "ADMIN") return forbiddenResponse()
    }

    // If setting as primary, unset current primary
    if (isPrimary) {
      await prisma.listingImage.updateMany({
        where: { listingId, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const image = await prisma.listingImage.create({
      data: {
        listingId,
        url,
        isPrimary: isPrimary || false,
        sortOrder: sortOrder || 0,
      },
    })

    return successResponse(image, undefined, undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// DELETE /api/listings/images — remove image from listing
export async function DELETE(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) return errorResponse("Missing imageId.")

    const image = await prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: { select: { sellerId: true } } },
    })

    if (!image) return errorResponse("Image not found.", 404)
    if (image.listing.sellerId !== currentUserId) return forbiddenResponse()

    await prisma.listingImage.delete({ where: { id: imageId } })

    return successResponse(null, "Image deleted.")
  } catch (error) {
    return internalErrorResponse(error)
  }
}
