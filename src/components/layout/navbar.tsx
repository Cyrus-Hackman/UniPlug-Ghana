"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import {
  Home,
  ShoppingBag,
  Plus,
  MessageCircle,
  User,
  Bell,
  Search,
  Menu,
  X,
  Heart,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
  Shield,
  BookOpen,
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import Image from "next/image"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href))

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  ]

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-green-800 flex items-center justify-center shadow-md">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg hidden sm:block">
                Student<span className="text-green-800">Market</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn("nav-link", isActive(href) && "nav-link-active")}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Desktop Search */}
            <Link
              href="/marketplace"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-400 hover:bg-gray-100 transition-colors w-64"
            >
              <Search className="w-4 h-4" />
              Search listings...
            </Link>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-2">
              {session ? (
                <>
                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    className={cn("btn-icon btn-ghost relative", isActive("/notifications") && "bg-green-50 text-green-800")}
                  >
                    <Bell className="w-5 h-5" />
                  </Link>

                  {/* Messages */}
                  <Link
                    href="/messages"
                    className={cn("btn-icon btn-ghost relative", isActive("/messages") && "bg-green-50 text-green-800")}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Link>

                  {/* Sell Button */}
                  <Link href="/sell" className="btn-primary btn-md">
                    <Plus className="w-4 h-4" />
                    Sell
                  </Link>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="avatar w-8 h-8 text-sm">
                        {session.user?.avatarUrl ? (
                          <Image
                            src={session.user.avatarUrl}
                            alt={session.user.name || ""}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(session.user?.name || "U")
                        )}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {session.user?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                          </div>

                          <div className="py-1">
                            <Link
                              href="/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
                            </Link>
                            <Link
                              href="/my-listings"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              My Listings
                            </Link>
                            <Link
                              href="/favourites"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Heart className="w-4 h-4" />
                              Saved Items
                            </Link>
                            <Link
                              href="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              Profile
                            </Link>
                            <Link
                              href="/settings"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              Settings
                            </Link>
                            {session.user?.role === "ADMIN" && (
                              <Link
                                href="/admin"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-800 hover:bg-green-50 transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                Admin Dashboard
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-gray-100 py-1 mt-1">
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                signOut({ callbackUrl: "/" })
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost btn-md">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary btn-md">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden btn-icon btn-ghost"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-3 px-4 space-y-1 animate-fade-in">
            <Link
              href="/marketplace"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Marketplace
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/sell"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-green-800 bg-green-50"
                >
                  <Plus className="w-4 h-4" />
                  Sell an Item
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    signOut({ callbackUrl: "/" })
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary btn-md flex-1 justify-center"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary btn-md flex-1 justify-center"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Nav */}
      {session && (
        <nav className="mobile-nav">
          <div className="flex items-center">
            {[
              { href: "/", icon: Home, label: "Home" },
              { href: "/marketplace", icon: ShoppingBag, label: "Browse" },
              { href: "/sell", icon: Plus, label: "Sell", primary: true },
              { href: "/messages", icon: MessageCircle, label: "Messages" },
              { href: "/profile", icon: User, label: "Profile" },
            ].map(({ href, icon: Icon, label, primary }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "mobile-nav-item",
                  isActive(href) && "mobile-nav-item-active",
                  primary && "relative"
                )}
              >
                {primary ? (
                  <div className="w-10 h-10 rounded-2xl bg-green-800 flex items-center justify-center -mt-4 shadow-lg">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <Icon className={cn("w-5 h-5", isActive(href) ? "text-green-800" : "text-gray-400")} />
                )}
                <span className={cn("text-[10px]", primary && "mt-1")}>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}
