import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"
import {
  ShoppingBag,
  MessageCircle,
  Heart,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import ListingCard from "@/components/marketplace/listing-card"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const [
    profile,
    activeListings,
    totalSold,
    totalBought,
    pendingOffers,
    borrowingRequests,
    unreadMessages,
    recentListings,
    savedListings,
    recentTransactions,
  ] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      include: {
        institution: { select: { name: true, shortName: true } },
        campus: { select: { name: true } },
      },
    }),
    prisma.listing.count({ where: { sellerId: userId, status: "ACTIVE" } }),
    prisma.transaction.count({ where: { sellerId: userId, status: "COMPLETED" } }),
    prisma.transaction.count({ where: { buyerId: userId, status: "COMPLETED" } }),
    prisma.offer.count({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: "PENDING",
      },
    }),
    prisma.borrowingRequest.count({
      where: {
        OR: [{ borrowerId: userId }, { lenderId: userId }],
        status: { in: ["PENDING", "APPROVED"] },
      },
    }),
    prisma.conversationParticipant
      .aggregate({ where: { userId }, _sum: { unreadCount: true } })
      .then(r => r._sum.unreadCount || 0),
    prisma.listing.findMany({
      where: { sellerId: userId, deletedAt: null },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          select: {
            id: true,
            verificationStatus: true,
            profile: { select: { fullName: true, avatarUrl: true, averageRating: true, ratingCount: true } },
          },
        },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        institution: { select: { id: true, name: true, shortName: true, slug: true } },
        campus: { select: { id: true, name: true, slug: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        _count: { select: { favourites: true } },
      },
    }),
    prisma.favourite.findMany({
      where: { userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                verificationStatus: true,
                profile: { select: { fullName: true, avatarUrl: true, averageRating: true, ratingCount: true } },
              },
            },
            category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
            institution: { select: { id: true, name: true, shortName: true, slug: true } },
            campus: { select: { id: true, name: true, slug: true } },
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
            _count: { select: { favourites: true } },
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { not: "CANCELLED" },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            title: true,
            slug: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        buyer: { select: { profile: { select: { fullName: true } } } },
        seller: { select: { profile: { select: { fullName: true } } } },
      },
    }),
  ])

  const firstName = profile?.fullName?.split(" ")[0] || "Student"

  const statCards = [
    {
      label: "Active Listings",
      value: activeListings,
      icon: ShoppingBag,
      color: "bg-green-100 text-green-700",
      href: "/my-listings",
    },
    {
      label: "Items Sold",
      value: totalSold,
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-700",
      href: "/transactions",
    },
    {
      label: "Pending Offers",
      value: pendingOffers,
      icon: AlertCircle,
      color: "bg-yellow-100 text-yellow-700",
      href: "/offers",
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      icon: MessageCircle,
      color: "bg-purple-100 text-purple-700",
      href: "/messages",
    },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container-main py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-gray-500 mt-0.5">
                {profile?.institution?.shortName || profile?.institution?.name
                  ? `${profile.institution!.shortName || profile.institution!.name}${profile.campus ? ` · ${profile.campus.name}` : ""}`
                  : "Manage your listings and transactions"}
              </p>
            </div>
            <Link href="/sell" className="btn-primary btn-md shrink-0">
              <Plus className="w-4 h-4" />
              New Listing
            </Link>
          </div>

          {/* Verification Banner */}
          {session.user.verificationStatus === "UNVERIFIED" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-800 text-sm">Verify your account</p>
                <p className="text-yellow-700 text-xs mt-0.5">
                  Verified accounts get more trust from buyers and sellers.
                </p>
              </div>
              <Link href="/settings#verification" className="btn-sm btn-ghost text-yellow-800 hover:bg-yellow-100 shrink-0">
                Verify →
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color, href }) => (
              <Link key={label} href={href} className="card card-hover card-body group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{label}</div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Listings */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Your Listings</h2>
                  <Link href="/my-listings" className="text-sm text-green-800 font-semibold flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {recentListings.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {recentListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing as any} showSeller={false} />
                    ))}
                  </div>
                ) : (
                  <div className="card card-body text-center py-10">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="text-gray-500 mb-4">You haven't listed anything yet.</p>
                    <Link href="/sell" className="btn-primary btn-md inline-flex">
                      <Plus className="w-4 h-4" />
                      Create your first listing
                    </Link>
                  </div>
                )}
              </div>

              {/* Saved Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Saved Items</h2>
                  <Link href="/favourites" className="text-sm text-green-800 font-semibold flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {savedListings.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {savedListings.map(({ listing }) => (
                      <ListingCard key={listing.id} listing={listing as any} />
                    ))}
                  </div>
                ) : (
                  <div className="card card-body text-center py-8">
                    <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No saved items yet.</p>
                    <Link href="/marketplace" className="text-sm text-green-800 font-semibold mt-2 inline-block">
                      Browse marketplace →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — Recent Transactions */}
            <div className="space-y-4">
              <div className="card">
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
                  <Link href="/transactions" className="text-xs text-green-800 font-semibold">View all</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map(tx => (
                      <div key={tx.id} className="px-5 py-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.status === "COMPLETED" ? "bg-green-100" :
                          tx.status === "PENDING" ? "bg-yellow-100" :
                          tx.status === "DISPUTED" ? "bg-red-100" : "bg-gray-100"
                        }`}>
                          {tx.status === "COMPLETED" ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                           tx.status === "PENDING" ? <Clock className="w-4 h-4 text-yellow-600" /> :
                           <AlertCircle className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{tx.listing.title}</p>
                          <p className="text-xs text-gray-400">
                            {tx.buyerId === userId ? "Bought from" : "Sold to"}{" "}
                            {tx.buyerId === userId
                              ? tx.seller.profile?.fullName
                              : tx.buyer.profile?.fullName}
                          </p>
                        </div>
                        <span className={`badge text-[10px] ${
                          tx.status === "COMPLETED" ? "badge-green" :
                          tx.status === "PENDING" ? "badge-gold" : "badge-gray"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">
                      No transactions yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="card card-body space-y-2">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Quick Actions</h3>
                {[
                  { href: "/sell", label: "📦 Sell an item" },
                  { href: "/marketplace", label: "🔍 Browse marketplace" },
                  { href: "/offers", label: "💬 View my offers" },
                  { href: "/borrowings", label: "🤝 Borrowing requests" },
                  { href: "/profile", label: "👤 Edit profile" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {label}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
