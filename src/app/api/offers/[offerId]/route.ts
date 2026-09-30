import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId, createNotification } from "@/lib/helpers"

interface Params {
  params: Promise<{ offerId: string }>
}

// PATCH /api/offers/[offerId] — respond to an offer
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { offerId } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: { select: { title: true, sellerId: true, status: true } },
        buyer: { select: { id: true, profile: { select: { fullName: true } } } },
        seller: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    })

    if (!offer) return notFoundResponse("Offer")

    const body = await req.json()
    const { status, counterAmount, message } = body

    // Buyer can withdraw
    if (status === "WITHDRAWN") {
      if (offer.buyerId !== currentUserId) return forbiddenResponse()
      if (offer.status !== "PENDING") return errorResponse("This offer can no longer be withdrawn.")

      await prisma.offer.update({ where: { id: offerId }, data: { status: "WITHDRAWN" } })
      return successResponse(null, "Offer withdrawn.")
    }

    // Only seller can accept/reject/counter
    if (offer.sellerId !== currentUserId) return forbiddenResponse()
    if (offer.status !== "PENDING") return errorResponse("This offer has already been responded to.")

    if (status === "ACCEPTED") {
      // Accept offer — create transaction
      const [updatedOffer, transaction] = await prisma.$transaction([
        prisma.offer.update({ where: { id: offerId }, data: { status: "ACCEPTED" } }),
        prisma.transaction.create({
          data: {
            listingId: offer.listingId,
            buyerId: offer.buyerId,
            sellerId: offer.sellerId,
            type: "PURCHASE",
            status: "ACCEPTED",
            amount: offer.amount,
            paymentMethod: "NOT_SET",
          },
        }),
        // Mark listing as reserved
        prisma.listing.update({
          where: { id: offer.listingId },
          data: { status: "RESERVED" },
        }),
        // Reject other pending offers
        prisma.offer.updateMany({
          where: {
            listingId: offer.listingId,
            id: { not: offerId },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        }),
      ])

      // Notify buyer
      await createNotification({
        userId: offer.buyerId,
        type: "OFFER_ACCEPTED",
        title: "Your offer was accepted! 🎉",
        body: `${offer.seller.profile?.fullName || "The seller"} accepted your offer of GH₵${offer.amount} for "${offer.listing.title}".`,
        link: `/transactions`,
        metadata: { offerId, listingId: offer.listingId },
      })

      return successResponse({ offer: updatedOffer, transaction }, "Offer accepted! Transaction created.")
    }

    if (status === "REJECTED") {
      await prisma.offer.update({ where: { id: offerId }, data: { status: "REJECTED" } })

      // Notify buyer
      await createNotification({
        userId: offer.buyerId,
        type: "OFFER_REJECTED",
        title: "Offer declined",
        body: `Your offer of GH₵${offer.amount} for "${offer.listing.title}" was declined.`,
        link: `/offers`,
        metadata: { offerId, listingId: offer.listingId },
      })

      return successResponse(null, "Offer declined.")
    }

    if (status === "COUNTERED") {
      if (!counterAmount || counterAmount <= 0) {
        return errorResponse("Please provide a valid counter-offer amount.")
      }

      const [updatedOffer, counterOffer] = await prisma.$transaction([
        prisma.offer.update({ where: { id: offerId }, data: { status: "COUNTERED" } }),
        prisma.offer.create({
          data: {
            listingId: offer.listingId,
            buyerId: offer.buyerId,
            sellerId: offer.sellerId,
            amount: counterAmount,
            message: message || null,
            status: "PENDING",
            parentOfferId: offerId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ])

      // Notify buyer
      await createNotification({
        userId: offer.buyerId,
        type: "OFFER_COUNTERED",
        title: "Counter-offer received",
        body: `${offer.seller.profile?.fullName || "The seller"} countered with GH₵${counterAmount} for "${offer.listing.title}".`,
        link: `/offers`,
        metadata: { offerId: counterOffer.id, listingId: offer.listingId },
      })

      return successResponse({ offer: updatedOffer, counterOffer }, "Counter-offer sent!")
    }

    return errorResponse("Invalid action.")
  } catch (error) {
    return internalErrorResponse(error)
  }
}
