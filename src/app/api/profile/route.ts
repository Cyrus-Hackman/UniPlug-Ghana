import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"

// GET /api/profile — current user's own profile
export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    })

    return successResponse(user)
  } catch (error) {
    return internalErrorResponse(error)
  }
}

// PATCH /api/profile — update own profile
export async function PATCH(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const body = await req.json()
    const {
      fullName,
      bio,
      phone,
      phoneVisible,
      avatarUrl,
      level,
      programme,
      institutionId,
      campusId,
    } = body

    // Validate
    if (fullName !== undefined && (!fullName.trim() || fullName.trim().length < 2)) {
      return errorResponse("Name must be at least 2 characters.", 400)
    }

    // Validate phone if provided
    if (phone !== undefined && phone) {
      const cleaned = phone.replace(/[\s-]/g, "")
      const isValid = /^(\+233|0)(20|23|24|25|26|27|28|29|54|55|56|57|58|59|50|51|52|53)[0-9]{7}$/.test(cleaned)
      if (!isValid) {
        return errorResponse("Please enter a valid Ghanaian phone number.", 400)
      }
    }

    const profile = await prisma.profile.upsert({
      where: { userId: currentUserId },
      update: {
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(bio !== undefined && { bio: bio.trim() || null }),
        ...(phone !== undefined && { phone: phone.trim() || null }),
        ...(phoneVisible !== undefined && { phoneVisible }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(level !== undefined && { level }),
        ...(programme !== undefined && { programme: programme.trim() || null }),
        ...(institutionId !== undefined && { institutionId: institutionId || null }),
        ...(campusId !== undefined && { campusId: campusId || null }),
      },
      create: {
        userId: currentUserId,
        fullName: fullName?.trim() || "Student",
        bio: bio?.trim() || null,
        phone: phone?.trim() || null,
        phoneVisible: phoneVisible || false,
        avatarUrl: avatarUrl || null,
        level: level || null,
        programme: programme?.trim() || null,
        institutionId: institutionId || null,
        campusId: campusId || null,
      },
    })

    return successResponse(profile, "Profile updated successfully.")
  } catch (error) {
    return internalErrorResponse(error)
  }
}
