import { createHmac, randomInt, timingSafeEqual } from "node:crypto"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const CODE_LIFETIME_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

export class VerificationCooldownError extends Error {
  constructor() {
    super("Please wait a minute before requesting another code.")
    this.name = "VerificationCooldownError"
  }
}

export class EmailDeliveryConfigurationError extends Error {
  constructor() {
    super("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.")
    this.name = "EmailDeliveryConfigurationError"
  }
}

export class EmailDeliveryError extends Error {
  constructor() {
    super("We could not send the verification email. Check the email settings and try again.")
    this.name = "EmailDeliveryError"
  }
}

function hashCode(userId: string, code: string): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new EmailDeliveryConfigurationError()
  return createHmac("sha256", secret).update(`${userId}:${code}`).digest("hex")
}

export async function issueEmailVerificationCode(userId: string, email: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from || !process.env.AUTH_SECRET) {
    throw new EmailDeliveryConfigurationError()
  }

  const existing = await prisma.emailVerificationCode.findUnique({ where: { userId } })
  if (existing && Date.now() - existing.updatedAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new VerificationCooldownError()
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0")
  const codeHash = hashCode(userId, code)
  const expiresAt = new Date(Date.now() + CODE_LIFETIME_MS)

  await prisma.emailVerificationCode.upsert({
    where: { userId },
    create: { userId, codeHash, expiresAt },
    update: { codeHash, expiresAt, attempts: 0 },
  })

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Verify your UniPlug Ghana email",
      text: `Your UniPlug Ghana verification code is ${code}. It expires in 10 minutes. If you did not create an account, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2937"><h1 style="color:#166534">Verify your email</h1><p>Enter this code to finish creating your UniPlug Ghana account:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#166534">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
    })

    if (error) throw error
  } catch (error) {
    await prisma.emailVerificationCode.deleteMany({ where: { userId, codeHash } })
    console.error("Verification email delivery failed:", error)
    throw new EmailDeliveryError()
  }
}

export async function verifyEmailCode(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      emailVerified: true,
      status: true,
      emailVerificationCode: true,
    },
  })

  if (!user || user.emailVerified || !user.emailVerificationCode) {
    return { success: false as const, reason: "invalid" as const }
  }

  const verification = user.emailVerificationCode
  if (verification.expiresAt.getTime() <= Date.now()) {
    await prisma.emailVerificationCode.delete({ where: { userId: user.id } })
    return { success: false as const, reason: "expired" as const }
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    return { success: false as const, reason: "attempts" as const }
  }

  const suppliedHash = hashCode(user.id, code)
  const matches = timingSafeEqual(Buffer.from(suppliedHash, "hex"), Buffer.from(verification.codeHash, "hex"))
  if (!matches) {
    await prisma.emailVerificationCode.updateMany({
      where: { userId: user.id, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    })
    return { success: false as const, reason: "invalid" as const }
  }

  if (user.status === "BANNED" || user.status === "SUSPENDED") {
    return { success: false as const, reason: "invalid" as const }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), status: "ACTIVE" },
    }),
    prisma.emailVerificationCode.delete({ where: { userId: user.id } }),
  ])

  return { success: true as const }
}
