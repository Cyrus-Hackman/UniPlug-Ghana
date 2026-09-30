import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get current session user with profile
export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: {
        include: {
          institution: true,
          campus: true,
        },
      },
    },
  })

  return user
}

// Get current user ID from session (lightweight)
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id || null
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === "ADMIN"
}

// Get session
export async function getSession() {
  return auth()
}

// Check if user can perform action on a listing
export async function canModifyListing(listingId: string, userId: string): Promise<boolean> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  })
  return listing?.sellerId === userId
}

// Create a notification for a user
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
  metadata,
}: {
  userId: string
  type: string
  title: string
  body: string
  link?: string
  metadata?: Record<string, unknown>
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        body,
        link,
        metadata: metadata as any,
      },
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
    return null
  }
}

// Check if two users are in a conversation together
export async function findOrCreateConversation(
  user1Id: string,
  user2Id: string,
  listingId?: string
): Promise<string> {
  // Check if conversation exists
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user1Id } } },
        { participants: { some: { userId: user2Id } } },
        listingId ? { listingId } : {},
      ],
    },
  })

  if (existing) return existing.id

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      listingId,
      participants: {
        create: [{ userId: user1Id }, { userId: user2Id }],
      },
    },
  })

  return conversation.id
}

// Check if user is blocked
export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  })
  return !!block
}

// Log admin action
export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>
) {
  try {
    await prisma.adminAction.create({
      data: {
        adminId,
        targetUserId,
        action,
        details: details as any,
      },
    })
  } catch (error) {
    console.error("Failed to log admin action:", error)
  }
}

// Update listing view count
export async function incrementListingViews(listingId: string) {
  await prisma.listing.update({
    where: { id: listingId },
    data: { views: { increment: 1 } },
  })
}

// Get user's unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

// Get user's total unread message count
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { unreadCount: true },
  })
  return participants.reduce((sum, p) => sum + p.unreadCount, 0)
}
