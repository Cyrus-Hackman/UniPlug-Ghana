import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { profile: true },
          })

          if (!user || !user.passwordHash) return null

          const isValid = await bcrypt.compare(password, user.passwordHash)
          if (!isValid) return null

          if (user.status === "SUSPENDED") {
            throw new Error("Your account has been suspended. Please contact support.")
          }

          if (user.status === "BANNED") {
            throw new Error("Your account has been banned.")
          }

          // Update last seen
          await prisma.user.update({
            where: { id: user.id },
            data: { lastSeenAt: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.profile?.fullName || "",
            role: user.role,
            status: user.status,
            verificationStatus: user.verificationStatus,
            avatarUrl: user.profile?.avatarUrl || null,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.status = (user as any).status
        token.verificationStatus = (user as any).verificationStatus
        token.avatarUrl = (user as any).avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.verificationStatus = token.verificationStatus as string
        session.user.avatarUrl = token.avatarUrl as string | null
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Log sign-in activity if needed
    },
  },
})
