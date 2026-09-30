import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/listings/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const currentUserId = await getCurrentUserId()

    const listing = await prisma.listing.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        deletedAt: null,
      },
      include: {
        seller: {
          select: {
            id: true,
            verificationStatus: true,
            createdAt: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                averageRating: true,
                ratingCount: true,
                completedTransactions: true,
                bio: true,
                phone: true,
                phoneVisible: true,
                institution: { select: { name: true, slug: true } },
                campus: { select: { name: true } },
              },
            },
          },
        },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        institution: { select: { id: true, name: true, shortName: true, slug: true } },
        campus: { select: { id: true, name: true, slug: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        _count: { select: { favourites: true, offers: true } },
      },
    })

    if (!listing) return notFoundResponse("Listing")

    // Increment views (non-blocking)
    if (currentUserId !== listing.sellerId) {
      prisma.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } }).catch(() => {})
    }

    // Check if favourited
    let isFavourited = false
    if (currentUserId) {
      const fav = await prisma.favourite.findUnique({
        where: { userId_listingId: { userId: currentUserId, listingId: listing.id } },
      })
      isFavourited = !!fav
    }

    // Hide phone if not visible publicly and not the seller
    const result = {
      ...listing,
      isFavourited,
      seller: {
        ...listing.seller,
        profile: listing.seller.profile
          ? {
              ...listing.seller.profile,
              phone:
                listing.seller.profile.phoneVisible || currentUserId === listing.sellerId
                  ? listing.seller.profile.phone
                  : null,
            }
          : null,
      },
    }

    return successResponse(result)
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// PATCH /api/listings/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    })

    if (!listing) return notFoundResponse("Listing")
    if (listing.sellerId !== currentUserId) {
      // Check if admin
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      })
      if (user?.role !== "ADMIN") return forbiddenResponse()
    }

    const body = await req.json()

    // Prevent negative prices
    if (body.price !== null && body.price !== undefined && body.price < 0) {
      return errorResponse("Price cannot be negative.")
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title.trim() }),
        ...(body.description && { description: body.description.trim() }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.subcategoryId !== undefined && { subcategoryId: body.subcategoryId }),
        ...(body.type && { type: body.type }),
        ...(body.status && { status: body.status }),
        ...(body.condition && { condition: body.condition }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.priceType && { priceType: body.priceType }),
        ...(body.isNegotiable !== undefined && { isNegotiable: body.isNegotiable }),
        ...(body.isFree !== undefined && { isFree: body.isFree }),
        ...(body.dailyRate !== undefined && { dailyRate: body.dailyRate }),
        ...(body.weeklyRate !== undefined && { weeklyRate: body.weeklyRate }),
        ...(body.deposit !== undefined && { deposit: body.deposit }),
        ...(body.maxLendingDays !== undefined && { maxLendingDays: body.maxLendingDays }),
        ...(body.availableFrom !== undefined && { availableFrom: body.availableFrom ? new Date(body.availableFrom) : null }),
        ...(body.availableTo !== undefined && { availableTo: body.availableTo ? new Date(body.availableTo) : null }),
        ...(body.lendingTerms !== undefined && { lendingTerms: body.lendingTerms }),
        ...(body.exchangeFor !== undefined && { exchangeFor: body.exchangeFor }),
        ...(body.exchangeExtra !== undefined && { exchangeExtra: body.exchangeExtra }),
        ...(body.institutionId !== undefined && { institutionId: body.institutionId }),
        ...(body.campusId !== undefined && { campusId: body.campusId }),
        ...(body.area !== undefined && { area: body.area }),
        ...(body.meetingLocation !== undefined && { meetingLocation: body.meetingLocation }),
        ...(body.tags && { tags: body.tags }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      },
    })

    return successResponse(updated, "Listing updated successfully.")
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// DELETE /api/listings/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    })

    if (!listing) return notFoundResponse("Listing")

    // Check ownership or admin
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    })

    if (listing.sellerId !== currentUserId && user?.role !== "ADMIN") {
      return forbiddenResponse()
    }

    // Soft delete
    await prisma.listing.update({
      where: { id },
      data: { status: "REMOVED", deletedAt: new Date() },
    })

    return successResponse(null, "Listing removed successfully.")
  } catch (error) {
    return internalErrorResponse(error)
  }
}
