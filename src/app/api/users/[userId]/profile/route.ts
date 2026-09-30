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
import { getCurrentUserId } from "@/lib/helpers"

// GET /api/users/[userId]/profile — public user profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId, status: { not: "BANNED" } },
      select: {
        id: true,
        createdAt: true,
        verificationStatus: true,
        role: true,
        profile: {
          select: {
            fullName: true,
            avatarUrl: true,
            bio: true,
            averageRating: true,
            ratingCount: true,
            completedTransactions: true,
            level: true,
            programme: true,
            phone: true,
            phoneVisible: true,
            institution: { select: { id: true, name: true, shortName: true, slug: true } },
            campus: { select: { id: true, name: true } },
          },
        },
        listings: {
          where: { status: "ACTIVE", deletedAt: null },
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            seller: {
              select: {
                id: true,
                verificationStatus: true,
                profile: { select: { fullName: true, avatarUrl: true, averageRating: true, ratingCount: true } },
              },
            },
            category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
            institution: { select: { id: true, name: true, shortName: true, slug: true } },
            campus: { select: { id: true, name: true, slug: true } },
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
            _count: { select: { favourites: true } },
          },
        },
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: {
                id: true,
                profile: { select: { fullName: true, avatarUrl: true } },
              },
            },
          },
        },
        _count: {
          select: {
            listings: { where: { status: "ACTIVE" } },
            reviewsReceived: true,
          },
        },
      },
    })

    if (!user) return notFoundResponse("User")

    // Don't expose phone if not visible
    if (user.profile && !user.profile.phoneVisible) {
      (user.profile as any).phone = null
    }

    return successResponse(user)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
