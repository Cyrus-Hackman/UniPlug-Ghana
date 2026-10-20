import { NextRequest } from "next/server"
import { z } from "zod"
import { verifyEmailCode } from "@/lib/email-verification"
import { checkRateLimit, errorResponse, rateLimitResponse, successResponse } from "@/lib/api-response"

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code from your email."),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(`verify-email:${ip}`, 10, 60 * 60 * 1000)) {
    return rateLimitResponse()
  }

  const parsed = verifySchema.safeParse(await req.json())
  if (!parsed.success) {
    return errorResponse("Enter a valid email address and six-digit verification code.", 400)
  }

  try {
    const result = await verifyEmailCode(parsed.data.email, parsed.data.code)
    if (result.success) {
      return successResponse(null, "Email verified. You can now sign in.")
    }

    if (result.reason === "expired") {
      return errorResponse("That code has expired. Request a new code and try again.", 400)
    }
    if (result.reason === "attempts") {
      return errorResponse("Too many incorrect attempts. Request a new verification code.", 429)
    }
    return errorResponse("The verification code is incorrect or no longer valid.", 400)
  } catch (error) {
    console.error("Email verification failed:", error)
    return errorResponse("We could not verify your email right now. Please try again.", 500)
  }
}
