import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import {
  successResponse,
  errorResponse,
  internalErrorResponse,
  validationErrorResponse,
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/api-response"
import bcrypt from "bcryptjs"
import {
  EmailDeliveryConfigurationError,
  EmailDeliveryError,
  VerificationCooldownError,
  issueEmailVerificationCode,
} from "@/lib/email-verification"

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registrations per IP per hour
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
      return rateLimitResponse()
    }

    const body = await req.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const [field, messages] of Object.entries(result.error.flatten().fieldErrors)) {
        if (messages) fieldErrors[field] = messages
      }
      return validationErrorResponse(fieldErrors)
    }

    const { fullName, email, password, phone, institutionId, campusId, studentId, level, programme } =
      result.data

    const normalizedEmail = email.toLowerCase()
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      if (!existingUser.emailVerified && existingUser.status !== "BANNED" && existingUser.status !== "SUSPENDED") {
        try {
          await issueEmailVerificationCode(existingUser.id, normalizedEmail)
          return successResponse(
            { userId: existingUser.id, verificationRequired: true },
            "A new verification code has been sent to your email."
          )
        } catch (error) {
          if (error instanceof VerificationCooldownError) {
            return successResponse(
              { userId: existingUser.id, verificationRequired: true },
              "A verification code was recently sent. Check your inbox or request another one in a minute."
            )
          }
          if (error instanceof EmailDeliveryConfigurationError) return errorResponse(error.message, 503)
          if (error instanceof EmailDeliveryError) return errorResponse(error.message, 503)
          throw error
        }
      }
      return errorResponse("An account with this email already exists.", 409)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create a pending account; login remains disabled until its email is verified.
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "STUDENT",
          status: "PENDING_VERIFICATION",
          verificationStatus: "UNVERIFIED",
        },
      })

      await tx.profile.create({
        data: {
          userId: newUser.id,
          fullName: fullName.trim(),
          phone: phone?.trim() || null,
          institutionId: institutionId || null,
          campusId: campusId || null,
          studentId: studentId?.trim() || null,
          level: level || null,
          programme: programme?.trim() || null,
        },
      })

      return newUser
    })

    try {
      await issueEmailVerificationCode(user.id, normalizedEmail)
    } catch (error) {
      await prisma.user.delete({ where: { id: user.id } })
      if (error instanceof VerificationCooldownError) return errorResponse(error.message, 429)
      if (error instanceof EmailDeliveryConfigurationError) return errorResponse(error.message, 503)
      if (error instanceof EmailDeliveryError) return errorResponse(error.message, 503)
      throw error
    }

    return successResponse(
      { userId: user.id, verificationRequired: true },
      "We sent a verification code to your email. Enter it to activate your account.",
      undefined,
      201
    )
  } catch (error) {
    return internalErrorResponse(error)
  }
}
