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
import { generateUniqueSlug, slugify } from "@/lib/utils"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

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
      return validationErrorResponse(result.error.flatten().fieldErrors as any)
    }

    const { fullName, email, password, phone, institutionId, campusId, studentId, level, programme } =
      result.data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return errorResponse("An account with this email already exists.", 409)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: "STUDENT",
          status: "ACTIVE",
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

    return successResponse(
      { userId: user.id },
      "Account created successfully. Welcome to Student Marketplace!",
      undefined,
      201
    )
  } catch (error) {
    return internalErrorResponse(error)
  }
}
