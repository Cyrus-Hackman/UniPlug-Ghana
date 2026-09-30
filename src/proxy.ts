import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/sell",
  "/my-listings",
  "/favourites",
  "/messages",
  "/notifications",
  "/offers",
  "/transactions",
  "/borrowings",
  "/profile",
  "/settings",
]

// Routes that require admin access
const adminRoutes = ["/admin"]

// Routes that should redirect authenticated users
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

export default auth((req) => {
  const { nextUrl } = req
  const isAuthenticated = !!req.auth
  const isAdmin = req.auth?.user?.role === "ADMIN"
  const pathname = nextUrl.pathname

  // Check admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, nextUrl))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  // Check protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, nextUrl))
    }
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}
