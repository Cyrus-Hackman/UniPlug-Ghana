import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  internalErrorResponse,
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"
import { changePasswordSchema } from "@/lib/validations"

// POST /api/users/change-password — { currentPassword, newPassword, confirmPassword }
export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    // Limits guessing the current password from a hijacked session
    if (!checkRateLimit(`change-password:${currentUserId}`, 5, 15 * 60 * 1000)) {
      return rateLimitResponse()
    }

    const parsed = changePasswordSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || "Please check your input.", 400)
    }
    const { currentPassword, newPassword } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { passwordHash: true },
    })
    if (!user?.passwordHash) return errorResponse("This account doesn't use a password.", 400)

    const matches = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!matches) return errorResponse("Your current password is incorrect.", 400)
    if (newPassword === currentPassword) {
      return errorResponse("Choose a new password that's different from your current one.", 400)
    }

    await prisma.user.update({
      where: { id: currentUserId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    })

    return successResponse(null, "Password changed successfully.")
  } catch (error) {
    return internalErrorResponse(error)
  }
}
