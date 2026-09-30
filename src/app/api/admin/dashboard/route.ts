import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

async function requireAdmin(currentUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true },
  })
  return user?.role === "ADMIN"
}

// GET /api/admin/dashboard — admin statistics
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()
    if (!(await requireAdmin(currentUserId))) return forbiddenResponse()

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      verifiedUsers,
      activeListings,
      soldListings,
      borrowingTransactions,
      completedTransactions,
      pendingReports,
      newUsersThisWeek,
      listingsByCategory,
      listingsByInstitution,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          verificationStatus: { in: ["EMAIL_VERIFIED", "STUDENT_VERIFIED", "FULLY_VERIFIED"] },
        },
      }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.count({ where: { status: "SOLD" } }),
      prisma.borrowingRequest.count({ where: { status: { in: ["ACTIVE", "APPROVED"] } } }),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.category.findMany({
        include: {
          _count: { select: { listings: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.institution.findMany({
        include: {
          _count: { select: { listings: { where: { status: "ACTIVE" } } } },
        },
        take: 10,
        orderBy: { name: "asc" },
      }),
    ])

    return successResponse({
      totalUsers,
      verifiedUsers,
      activeListings,
      soldListings,
      borrowingTransactions,
      completedTransactions,
      pendingReports,
      newUsersThisWeek,
      listingsByCategory: listingsByCategory.map((c) => ({
        name: c.name,
        count: c._count.listings,
      })),
      listingsByInstitution: listingsByInstitution.map((i) => ({
        name: i.shortName || i.name,
        count: i._count.listings,
      })),
    })
  } catch (error) {
    return internalErrorResponse(error)
  }
}
