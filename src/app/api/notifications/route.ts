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

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const unreadOnly = searchParams.get("unread") === "true"

    const where: any = { userId: currentUserId }
    if (unreadOnly) where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: currentUserId, isRead: false } }),
    ])

    return successResponse(
      { notifications, unreadCount },
      undefined,
      getPaginationMeta(total, page, limit)
    )
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const body = await req.json()

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: currentUserId, isRead: false },
        data: { isRead: true },
      })
      return successResponse(null, "All notifications marked as read.")
    }

    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: { id: body.notificationId, userId: currentUserId },
        data: { isRead: true },
      })
      return successResponse(null, "Notification marked as read.")
    }

    return successResponse(null)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
