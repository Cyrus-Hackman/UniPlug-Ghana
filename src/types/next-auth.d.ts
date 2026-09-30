import type { DefaultSession, DefaultUser } from "next-auth"
import type { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: string
      status: string
      verificationStatus: string
      avatarUrl: string | null
    }
  }

  interface User extends DefaultUser {
    role?: string
    status?: string
    verificationStatus?: string
    avatarUrl?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    status?: string
    verificationStatus?: string
    avatarUrl?: string | null
  }
}
