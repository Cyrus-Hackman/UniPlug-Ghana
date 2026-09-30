import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Flag,
  BookOpen,
  Building2,
  Star,
  ArrowRight,
} from "lucide-react"

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    verifiedUsers,
    newUsersThisWeek,
    activeListings,
    soldListings,
    pendingReports,
    completedTransactions,
    borrowingActive,
    categoryStats,
    institutionStats,
    recentReports,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { verificationStatus: { in: ["EMAIL_VERIFIED", "STUDENT_VERIFIED", "FULLY_VERIFIED"] } } }),
    prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.listing.count({ where: { status: "SOLD" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { status: "COMPLETED" } }),
    prisma.borrowingRequest.count({ where: { status: { in: ["ACTIVE", "APPROVED"] } } }),
    prisma.category.findMany({
      include: { _count: { select: { listings: { where: { status: "ACTIVE" } } } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.institution.findMany({
      take: 8,
      orderBy: { name: "asc" },
      include: { _count: { select: { listings: { where: { status: "ACTIVE" } } } } },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { profile: { select: { fullName: true } } } },
        listing: { select: { title: true } },
        reportedUser: { select: { profile: { select: { fullName: true } } } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { fullName: true, institution: { select: { shortName: true, name: true } } } } },
    }),
  ])

  const stats = [
    { label: "Total Users", value: totalUsers, sub: `+${newUsersThisWeek} this week`, icon: Users, color: "bg-blue-100 text-blue-700", href: "/admin/users" },
    { label: "Verified Users", value: verifiedUsers, sub: `${Math.round((verifiedUsers / totalUsers) * 100)}% of total`, icon: CheckCircle, color: "bg-green-100 text-green-700", href: "/admin/users" },
    { label: "Active Listings", value: activeListings, sub: `${soldListings} sold`, icon: ShoppingBag, color: "bg-purple-100 text-purple-700", href: "/admin/listings" },
    { label: "Pending Reports", value: pendingReports, sub: "Needs review", icon: Flag, color: pendingReports > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600", href: "/admin/reports" },
    { label: "Completed Transactions", value: completedTransactions, sub: "All time", icon: TrendingUp, color: "bg-emerald-100 text-emerald-700", href: "/admin/transactions" },
    { label: "Active Borrowings", value: borrowingActive, sub: "Currently out", icon: Clock, color: "bg-orange-100 text-orange-700", href: "/admin/transactions" },
  ]

  const adminPages = [
    { href: "/admin/users", icon: Users, label: "Users", desc: "Manage student accounts" },
    { href: "/admin/listings", icon: ShoppingBag, label: "Listings", desc: "Moderate marketplace listings" },
    { href: "/admin/categories", icon: BookOpen, label: "Categories", desc: "Manage listing categories" },
    { href: "/admin/institutions", icon: Building2, label: "Institutions", desc: "Manage universities and colleges" },
    { href: "/admin/reports", icon: Flag, label: "Reports", desc: "Review flagged content" },
    { href: "/admin/transactions", icon: TrendingUp, label: "Transactions", desc: "View transaction history" },
    { href: "/admin/settings", icon: Settings, label: "Settings", desc: "Platform configuration" },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Admin Nav */}
      <div className="bg-green-900 text-white">
        <div className="container-main py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-green-900" />
              </div>
              <div>
                <span className="font-bold text-lg">Student Marketplace</span>
                <span className="ml-2 badge bg-yellow-400 text-green-900 text-[10px]">Admin</span>
              </div>
            </div>
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>

      <div className="container-main py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Overview of the Student Marketplace platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, sub, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="card card-hover card-body group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="font-semibold text-gray-700 text-sm">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Reports */}
            {recentReports.length > 0 && (
              <div className="card">
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    Pending Reports
                    <span className="badge badge-red">{pendingReports}</span>
                  </h2>
                  <Link href="/admin/reports" className="text-xs text-green-800 font-semibold">View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentReports.map(report => (
                    <div key={report.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {report.listing?.title || report.reportedUser?.profile?.fullName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Reported by {report.reporter.profile?.fullName} · {report.reason.replace("_", " ")}
                          </p>
                        </div>
                        <Link href="/admin/reports" className="text-xs text-green-800 shrink-0 font-semibold">Review</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Stats */}
            <div className="card card-body">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Listings by Category
              </h2>
              <div className="space-y-3">
                {categoryStats.sort((a, b) => b._count.listings - a._count.listings).map(cat => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-48 truncate">{cat.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-700 rounded-full"
                        style={{ width: activeListings > 0 ? `${Math.min(100, (cat._count.listings / activeListings) * 100)}%` : "0%" }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{cat._count.listings}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Access */}
            <div className="card card-body">
              <h3 className="font-bold text-gray-900 mb-3">Admin Pages</h3>
              <div className="space-y-1">
                {adminPages.map(({ href, icon: Icon, label, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Icon className="w-4 h-4 text-gray-600 group-hover:text-green-800" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="card card-body">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Recent Users</h3>
                <Link href="/admin/users" className="text-xs text-green-800 font-semibold">See all</Link>
              </div>
              <div className="space-y-3">
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2.5">
                    <div className="avatar w-8 h-8 text-xs">
                      {(user.profile?.fullName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{user.profile?.fullName || "No name"}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {user.profile?.institution?.shortName || user.profile?.institution?.name || user.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
