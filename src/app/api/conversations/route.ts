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

// GET /api/conversations — get user's conversations
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = getPaginationParams(searchParams)

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          participants: { some: { userId: currentUserId } },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  profile: { select: { fullName: true, avatarUrl: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.conversation.count({
        where: { participants: { some: { userId: currentUserId } } },
      }),
    ])

    return successResponse(conversations, undefined, getPaginationMeta(total, page, limit))
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// POST /api/conversations — start a conversation
export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const body = await req.json()
    const { recipientId, listingId, initialMessage } = body

    if (!recipientId || recipientId === currentUserId) {
      return successResponse(null, "Invalid recipient.", undefined, 400)
    }

    // Find or create conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: recipientId } } },
          listingId ? { listingId } : { listingId: null },
        ],
      },
    })

    if (existing) {
      return successResponse({ conversationId: existing.id }, "Conversation already exists.")
    }

    const conversation = await prisma.conversation.create({
      data: {
        listingId: listingId || null,
        participants: {
          create: [{ userId: currentUserId }, { userId: recipientId }],
        },
        ...(initialMessage && {
          messages: {
            create: {
              senderId: currentUserId,
              content: initialMessage,
            },
          },
          lastMessageAt: new Date(),
        }),
      },
    })

    // Update unread count for recipient
    if (initialMessage) {
      await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId: conversation.id, userId: recipientId } },
        data: { unreadCount: { increment: 1 } },
      })

      // Notify recipient
      const senderProfile = await prisma.profile.findUnique({
        where: { userId: currentUserId },
        select: { fullName: true },
      })

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: "NEW_MESSAGE",
          title: "New message",
          body: `${senderProfile?.fullName || "Someone"} sent you a message.`,
          link: `/messages/${conversation.id}`,
          metadata: { conversationId: conversation.id } as any,
        },
      })
    }

    return successResponse({ conversationId: conversation.id }, "Conversation started!", undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
