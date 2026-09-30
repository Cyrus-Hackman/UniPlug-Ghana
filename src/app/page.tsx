import Link from "next/link"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/layout/navbar"
import ListingCard from "@/components/marketplace/listing-card"
import {
  Search,
  ShoppingBag,
  ArrowRight,
  BookOpen,
  Laptop,
  Shirt,
  Package,
  Home,
  Wrench,
  Gift,
  CheckCircle,
  MessageCircle,
  Star,
  Users,
  Shield,
  Sparkles,
  RefreshCw,
  HandshakeIcon,
} from "lucide-react"
import { formatGHS } from "@/lib/utils"

import { MOCK_LISTINGS, MOCK_CATEGORIES, MOCK_INSTITUTIONS } from "@/lib/mock-data"

async function getHomeData() {
  try {
    const [recentListings, categories, featuredListings, stats] = await Promise.all([
      prisma.listing.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        take: 8,
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
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 8,
      }),
      prisma.listing.findMany({
        where: { status: "ACTIVE", isFeatured: true, deletedAt: null },
        take: 4,
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
      Promise.all([
        prisma.listing.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.institution.count({ where: { isActive: true } }),
        prisma.transaction.count({ where: { status: "COMPLETED" } }),
      ]),
    ])

    if (recentListings.length > 0) {
      return { recentListings, categories, featuredListings, stats }
    }
  } catch (error) {
    // Graceful fallback to demo listings if DB is not yet connected
    console.warn("Using offline fallback data for homepage:", error instanceof Error ? error.message : error)
  }

  return {
    recentListings: MOCK_LISTINGS,
    categories: MOCK_CATEGORIES,
    featuredListings: MOCK_LISTINGS.filter((l) => l.isFeatured),
    stats: [MOCK_LISTINGS.length + 120, 480, MOCK_INSTITUTIONS.length + 8, 350],
  }
}

const categoryIcons: Record<string, React.ElementType> = {
  "textbooks-study-materials": BookOpen,
  electronics: Laptop,
  fashion: Shirt,
  "school-supplies": Package,
  "dorm-hostel": Home,
  services: Wrench,
  "free-giveaway": Gift,
}

const categoryEmojis: Record<string, string> = {
  "textbooks-study-materials": "📚",
  electronics: "💻",
  fashion: "👗",
  "school-supplies": "🎒",
  "dorm-hostel": "🛏️",
  services: "⚙️",
  "free-giveaway": "🎁",
}

export default async function HomePage() {
  const { recentListings, categories, featuredListings, stats } = await getHomeData()
  const [totalListings, totalUsers, totalInstitutions, totalTransactions] = stats

  return (
    <>
      <Navbar />
      <main>
        {/* ======================================================
            HERO SECTION
           ====================================================== */}
        <section className="hero-gradient relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-yellow-400/10" />
          </div>

          <div className="container-main relative py-16 md:py-24 lg:py-28">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-white/90 text-sm font-medium">
                  Ghana's #1 Student Marketplace
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Buy, Sell, Swap &{" "}
                <span className="text-yellow-400">Borrow</span> on Campus
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
                The marketplace built for students in Ghana. Buy, sell, exchange and lend items safely
                within your campus community.
              </p>

              {/* Search Bar */}
              <form
                action="/marketplace"
                method="get"
                className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-2xl max-w-xl mx-auto mb-8"
              >
                <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search textbooks, laptops, clothes, calculators..."
                  className="flex-1 text-gray-800 text-sm outline-none placeholder:text-gray-400 bg-transparent"
                />
                <button
                  type="submit"
                  className="btn-primary btn-md whitespace-nowrap"
                >
                  Search
                </button>
              </form>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/marketplace" className="btn-gold btn-lg shadow-lg">
                  <ShoppingBag className="w-5 h-5" />
                  Browse Marketplace
                </Link>
                <Link
                  href="/sell"
                  className="btn btn-lg border-2 border-white/40 text-white hover:bg-white/10 transition-colors"
                >
                  Sell an Item
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
                {[
                  { value: `${totalListings.toLocaleString()}+`, label: "Active Listings" },
                  { value: `${totalUsers.toLocaleString()}+`, label: "Students" },
                  { value: `${totalInstitutions}+`, label: "Institutions" },
                  { value: `${totalTransactions.toLocaleString()}+`, label: "Transactions" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-white/70 text-xs mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            CATEGORIES
           ====================================================== */}
        <section className="section bg-gray-50">
          <div className="container-main">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title">Shop by Category</h2>
                <p className="section-subtitle !mb-0">Find exactly what you need</p>
              </div>
              <Link
                href="/marketplace"
                className="text-sm font-semibold text-green-800 flex items-center gap-1 hover:gap-2 transition-all"
              >
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/marketplace?category=${cat.slug}`}>
                  <div className="category-card">
                    <span className="text-3xl">{categoryEmojis[cat.slug] || "📦"}</span>
                    <span className="text-xs font-semibold text-gray-700 leading-tight text-center">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400">
                  Categories are being set up. Please seed the database.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            FEATURED / RECENT LISTINGS
           ====================================================== */}
        <section className="section">
          <div className="container-main">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title">Recently Added</h2>
                <p className="section-subtitle !mb-0">Fresh listings from students near you</p>
              </div>
              <Link
                href="/marketplace"
                className="text-sm font-semibold text-green-800 flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recentListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing as any} />
                ))}
              </div>
            ) : (
              <div className="empty-state bg-gray-50 rounded-3xl">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Be the first to list!</h3>
                <p className="text-gray-500 mb-6">No listings yet. Start selling your items to other students.</p>
                <Link href="/sell" className="btn-primary btn-lg">
                  <Plus className="w-5 h-5" />
                  Create a Listing
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================
            TRANSACTION TYPES
           ====================================================== */}
        <section className="section bg-gradient-to-br from-green-900 to-green-800 text-white">
          <div className="container-main">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-2">More than just buying & selling</h2>
              <p className="text-white/70">Multiple ways to trade with fellow students</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: ShoppingBag,
                  emoji: "🛒",
                  title: "Buy & Sell",
                  desc: "List items for fixed or negotiable prices. Make offers and close deals.",
                  color: "from-green-400/20 to-emerald-500/20",
                },
                {
                  icon: RefreshCw,
                  emoji: "🔄",
                  title: "Exchange / Swap",
                  desc: "Trade your items for something you need. Add cash top-ups if needed.",
                  color: "from-blue-400/20 to-cyan-500/20",
                },
                {
                  icon: HandshakeIcon,
                  emoji: "🤝",
                  title: "Lend & Borrow",
                  desc: "Lend items by the day or week. Borrow what you need temporarily.",
                  color: "from-purple-400/20 to-violet-500/20",
                },
                {
                  icon: Gift,
                  emoji: "🎁",
                  title: "Free / Giveaway",
                  desc: "Give away items you no longer need to fellow students for free.",
                  color: "from-yellow-400/20 to-orange-500/20",
                },
              ].map(({ icon: Icon, emoji, title, desc, color }) => (
                <div
                  key={title}
                  className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5 backdrop-blur-sm`}
                >
                  <div className="text-4xl mb-3">{emoji}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================
            HOW IT WORKS
           ====================================================== */}
        <section className="section bg-gray-50">
          <div className="container-main">
            <div className="text-center mb-10">
              <h2 className="section-title">How it works</h2>
              <p className="section-subtitle">Simple, safe and student-friendly</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  emoji: "🔍",
                  title: "Find an item",
                  desc: "Search or browse by category, institution, price, or condition.",
                },
                {
                  step: "02",
                  emoji: "💬",
                  title: "Contact the student",
                  desc: "Message the seller directly through our secure chat system.",
                },
                {
                  step: "03",
                  emoji: "🤝",
                  title: "Agree on a deal",
                  desc: "Make an offer, negotiate, or accept the listed price.",
                },
                {
                  step: "04",
                  emoji: "📍",
                  title: "Meet safely on campus",
                  desc: "Choose a safe public meeting location on your campus.",
                },
                {
                  step: "05",
                  emoji: "✅",
                  title: "Complete the trade",
                  desc: "Exchange the item and confirm the transaction is complete.",
                },
                {
                  step: "06",
                  emoji: "⭐",
                  title: "Rate your experience",
                  desc: "Leave a review to help build trust in the community.",
                },
              ].map(({ step, emoji, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-green-800 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {step}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">{emoji}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-gray-500 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================
            TRUST & SAFETY
           ====================================================== */}
        <section className="section">
          <div className="container-main">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 border border-green-100">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-green-800 rounded-2xl mb-4">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Your safety is our priority
                  </h2>
                  <p className="text-gray-600">We've built Student Marketplace with trust at its core</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    {
                      icon: CheckCircle,
                      title: "Verified Students",
                      desc: "Verified badges for students who confirm their identity and institution.",
                    },
                    {
                      icon: Star,
                      title: "Ratings & Reviews",
                      desc: "Transparent reputation system based on real completed transactions.",
                    },
                    {
                      icon: Shield,
                      title: "Report & Block",
                      desc: "Report suspicious listings or users. Block anyone who makes you uncomfortable.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-green-800" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-green-200">
                  <p className="text-center text-sm font-semibold text-green-800 mb-3">
                    🔒 Safety Tips
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Meet in public campus locations.",
                      "Inspect items before completing a transaction.",
                      "Avoid sharing personal passwords or account credentials.",
                      "Be cautious of prices that seem unusually low.",
                      "Never share OTPs or sensitive financial information.",
                      "Trust your instincts — if something feels wrong, walk away.",
                    ].map((tip) => (
                      <div key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            CTA
           ====================================================== */}
        <section className="section bg-green-900">
          <div className="container-main text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to join thousands of students?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              Start buying, selling, and trading with students at universities across Ghana.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-gold btn-xl shadow-lg">
                <Users className="w-5 h-5" />
                Join for Free
              </Link>
              <Link href="/marketplace" className="btn btn-xl border-2 border-white/30 text-white hover:bg-white/10 transition-colors">
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container-main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-green-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg">Student<span className="text-green-400">Market</span></span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The marketplace built for students in Ghana.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm">Marketplace</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/marketplace" className="hover:text-white transition-colors">Browse All</Link></li>
                  <li><Link href="/marketplace?type=LEND" className="hover:text-white transition-colors">Borrow Items</Link></li>
                  <li><Link href="/marketplace?type=EXCHANGE" className="hover:text-white transition-colors">Exchange</Link></li>
                  <li><Link href="/marketplace?type=GIVEAWAY" className="hover:text-white transition-colors">Free Items</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm">Account</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                  <li><Link href="/sell" className="hover:text-white transition-colors">Sell an Item</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><span className="cursor-pointer hover:text-white transition-colors">Safety Tips</span></li>
                  <li><span className="cursor-pointer hover:text-white transition-colors">Report an Issue</span></li>
                  <li><span className="cursor-pointer hover:text-white transition-colors">Contact Us</span></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
              <span>© {new Date().getFullYear()} Student Marketplace Ghana. All rights reserved.</span>
              <span>Made with ❤️ for Ghanaian students</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

// Fix missing Plus import
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
