import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse,
  internalErrorResponse,
  getPaginationParams,
  getPaginationMeta,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

interface Params {
  params: Promise<{ conversationId: string }>
}

// GET /api/conversations/[conversationId]/messages
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { conversationId } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
    })
    if (!participant) return forbiddenResponse("You are not a participant in this conversation.")

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = getPaginationParams(searchParams)

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId, deletedAt: null },
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId, deletedAt: null } }),
    ])

    // Mark messages as read
    await prisma.$transaction([
      prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: currentUserId },
          isRead: false,
        },
        data: { isRead: true },
      }),
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: currentUserId } },
        data: { unreadCount: 0, lastReadAt: new Date() },
      }),
    ])

    return successResponse(messages.reverse(), undefined, getPaginationMeta(total, page, limit))
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// POST /api/conversations/[conversationId]/messages
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { conversationId } = await params
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
      include: { conversation: { include: { participants: true } } },
    })
    if (!participant) return forbiddenResponse("You are not a participant in this conversation.")

    const body = await req.json()
    if (!body.content?.trim()) {
      return errorResponse("Message content is required.")
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: currentUserId,
        content: body.content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
    })

    // Update conversation timestamp and unread counts for other participants
    const otherParticipants = participant.conversation.participants.filter(
      (p) => p.userId !== currentUserId
    )

    await Promise.all([
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
      ...otherParticipants.map((p) =>
        prisma.conversationParticipant.update({
          where: { conversationId_userId: { conversationId, userId: p.userId } },
          data: { unreadCount: { increment: 1 } },
        })
      ),
      // Notify other participants
      ...otherParticipants.map((p) =>
        prisma.notification.create({
          data: {
            userId: p.userId,
            type: "NEW_MESSAGE",
            title: "New message",
            body: `${message.sender.profile?.fullName || "Someone"}: ${body.content.slice(0, 100)}`,
            link: `/messages/${conversationId}`,
            metadata: { conversationId, messageId: message.id } as any,
          },
        })
      ),
    ])

    return successResponse(message, undefined, undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
