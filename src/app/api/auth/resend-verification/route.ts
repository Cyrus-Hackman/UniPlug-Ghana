import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  EmailDeliveryConfigurationError,
  EmailDeliveryError,
  issueEmailVerificationCode,
  VerificationCooldownError,
} from "@/lib/email-verification"
import { checkRateLimit, errorResponse, rateLimitResponse, successResponse } from "@/lib/api-response"

const resendSchema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(`resend-verification:${ip}`, 5, 60 * 60 * 1000)) {
    return rateLimitResponse()
  }

  const parsed = resendSchema.safeParse(await req.json())
  if (!parsed.success) return errorResponse("Enter a valid email address.", 400)

  try {
    const email = parsed.data.email.toLowerCase()
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true, status: true },
    })

    if (user && !user.emailVerified && user.status !== "BANNED" && user.status !== "SUSPENDED") {
      await issueEmailVerificationCode(user.id, user.email)
    }

    return successResponse(
      null,
      "If this address has an unverified account, a verification code will be sent."
    )
  } catch (error) {
    if (error instanceof VerificationCooldownError) return errorResponse(error.message, 429)
    if (error instanceof EmailDeliveryConfigurationError) return errorResponse(error.message, 503)
    if (error instanceof EmailDeliveryError) return errorResponse(error.message, 503)
    console.error("Could not resend verification email:", error)
    return errorResponse("We could not send a verification code right now. Please try again.", 500)
  }
}
