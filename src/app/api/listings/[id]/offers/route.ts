import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId, createNotification } from "@/lib/helpers"

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/listings/[id]/offers — create an offer
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: listingId } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          select: { id: true, profile: { select: { fullName: true } } },
        },
      },
    })

    if (!listing) return notFoundResponse("Listing")
    if (listing.sellerId === currentUserId) {
      return errorResponse("You cannot make an offer on your own listing.", 400)
    }
    if (listing.status !== "ACTIVE") {
      return errorResponse("This listing is no longer active.", 400)
    }
    if (listing.type !== "SELL") {
      return errorResponse("Offers can only be made on listings for sale.", 400)
    }

    const body = await req.json()
    if (!body.amount || body.amount <= 0) {
      return errorResponse("Please enter a valid offer amount.", 400)
    }

    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId: currentUserId,
        sellerId: listing.sellerId,
        amount: body.amount,
        message: body.message || null,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        buyer: {
          select: { profile: { select: { fullName: true } } },
        },
      },
    })

    // Notify seller
    await createNotification({
      userId: listing.sellerId,
      type: "NEW_OFFER",
      title: "New offer received",
      body: `${offer.buyer.profile?.fullName || "Someone"} made an offer of GH₵${body.amount} on your listing "${listing.title}".`,
      link: `/offers`,
      metadata: { offerId: offer.id, listingId },
    })

    return successResponse(offer, "Offer submitted successfully!", undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// GET /api/listings/[id]/offers — get offers for a listing
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: listingId } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })

    if (!listing) return notFoundResponse("Listing")

    // Only seller can see all offers
    if (listing.sellerId !== currentUserId) {
      // Buyer can see their own offers
      const myOffers = await prisma.offer.findMany({
        where: { listingId, buyerId: currentUserId },
        orderBy: { createdAt: "desc" },
      })
      return successResponse(myOffers)
    }

    const offers = await prisma.offer.findMany({
      where: { listingId, parentOfferId: null },
      include: {
        buyer: {
          select: {
            id: true,
            profile: { select: { fullName: true, avatarUrl: true, averageRating: true } },
          },
        },
        counterOffers: {
          include: {
            buyer: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return successResponse(offers)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
