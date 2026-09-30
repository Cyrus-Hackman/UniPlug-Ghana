import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const body = await req.json()
    const { reason, description, listingId, reportedUserId } = body

    if (!reason) return errorResponse("Please select a report reason.", 400)
    if (!listingId && !reportedUserId) {
      return errorResponse("Please specify what you are reporting.", 400)
    }
    if (reportedUserId === currentUserId) {
      return errorResponse("You cannot report yourself.", 400)
    }

    // Check for duplicate recent report (within 24 hours)
    const recentReport = await prisma.report.findFirst({
      where: {
        reporterId: currentUserId,
        ...(listingId ? { listingId } : {}),
        ...(reportedUserId ? { reportedUserId } : {}),
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    if (recentReport) {
      return errorResponse("You have already reported this recently. Our team is reviewing it.", 409)
    }

    const report = await prisma.report.create({
      data: {
        reporterId: currentUserId,
        reason: reason as any,
        description: description?.trim() || null,
        listingId: listingId || null,
        reportedUserId: reportedUserId || null,
        status: "PENDING",
      },
    })

    return successResponse(report, "Report submitted. Our team will review it shortly.", undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
