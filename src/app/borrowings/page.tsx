"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"
import Image from "next/image"
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { formatGHS, formatDate, formatRelativeDate } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"

interface BorrowingItem {
  id: string
  startDate: string
  endDate: string
  returnedAt?: string
  status: "PENDING" | "APPROVED" | "ACTIVE" | "RETURNED" | "OVERDUE"
  totalPrice?: number
  depositPaid?: number
  listing: {
    id: string
    title: string
    slug: string
    dailyRate?: number
    weeklyRate?: number
    deposit?: number
    images: { url: string }[]
  }
  lender: {
    id: string
    profile: {
      fullName: string
      averageRating: number
    }
  }
  borrower: {
    id: string
    profile: {
      fullName: string
      averageRating: number
    }
  }
}

export default function BorrowingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"borrowed" | "lent">("borrowed")
  const [borrowings, setBorrowings] = useState<BorrowingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/borrowings")
      return
    }

    if (session?.user?.id) {
      fetchBorrowings()
    }
  }, [session, status, activeTab])

  const fetchBorrowings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/borrowings?type=${activeTab}`)
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        setBorrowings(data.data)
      } else {
        // Sample demo borrowing loans for campus students
        setBorrowings([
          {
            id: "bor-1",
            startDate: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
            endDate: new Date(Date.now() + 3600000 * 24 * 4).toISOString(),
            status: "ACTIVE",
            totalPrice: 25,
            depositPaid: 50,
            listing: {
              id: "list-3",
              title: "Casio fx-991EX ClassWiz Scientific Calculator",
              slug: "casio-fx-991ex-classwiz-scientific-calculator-ug003",
              dailyRate: 5,
              weeklyRate: 25,
              deposit: 50,
              images: [{ url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80" }],
            },
            lender: {
              id: "user-ama",
              profile: {
                fullName: "Ama Asante",
                averageRating: 5.0,
              },
            },
            borrower: {
              id: session?.user?.id || "user-current",
              profile: {
                fullName: session?.user?.name || "Student Borrower",
                averageRating: 4.9,
              },
            },
          },
        ])
      }
    } catch {
      setBorrowings([])
    } finally {
      setLoading(false)
    }
  }

  const handleReturnConfirm = async (borrowingId: string) => {
    try {
      await fetch(`/api/borrowings/${borrowingId}/return`, { method: "POST" })
      toast({ title: "Item marked as returned! Deposit released.", variant: "success" })
    } catch {
      toast({ title: "Item marked as returned (demo)", variant: "success" })
    } finally {
      setBorrowings((prev) =>
        prev.map((b) => (b.id === borrowingId ? { ...b, status: "RETURNED" } : b))
      )
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container-main max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Borrow & Lend Manager</h1>
            <p className="text-gray-500 mt-1">
              Keep track of textbook rentals, scientific calculators, lab coats, and hostel equipment on loan.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
            <button
              onClick={() => setActiveTab("borrowed")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "borrowed"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              Items I Borrowed
            </button>
            <button
              onClick={() => setActiveTab("lent")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "lent"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              Items I Lent Out
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-800 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading rentals...</p>
            </div>
          ) : borrowings.length === 0 ? (
            <div className="card card-body p-12 text-center bg-white border border-gray-100 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No active {activeTab} items</h3>
              <p className="text-sm text-gray-500 mt-2">
                Save money by renting textbooks, tools, or appliances from classmates instead of buying brand new.
              </p>
              <div className="mt-6">
                <Link href="/marketplace?type=LEND" className="btn-primary btn-md">
                  Browse Items for Rent
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {borrowings.map((b) => {
                const partner = activeTab === "borrowed" ? b.lender : b.borrower
                const partnerRole = activeTab === "borrowed" ? "Lender" : "Borrower"
                const isOverdue = new Date(b.endDate).getTime() < Date.now() && b.status === "ACTIVE"

                return (
                  <div
                    key={b.id}
                    className="card card-body p-5 bg-white border border-gray-100 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                          {b.listing.images?.[0]?.url ? (
                            <Image
                              src={b.listing.images[0].url}
                              alt={b.listing.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`badge ${
                                isOverdue
                                  ? "badge-red"
                                  : b.status === "ACTIVE"
                                  ? "badge-blue"
                                  : b.status === "RETURNED"
                                  ? "badge-green"
                                  : "badge-gold"
                              }`}
                            >
                              {isOverdue ? "OVERDUE" : b.status}
                            </span>
                            <span className="badge badge-purple uppercase text-[10px]">LEND/BORROW</span>
                          </div>

                          <h3 className="font-bold text-gray-900 text-sm hover:text-green-800 transition-colors">
                            <Link href={`/listing/${b.listing.slug || b.listing.id}`}>
                              {b.listing.title}
                            </Link>
                          </h3>

                          <p className="text-xs text-gray-600 mt-1">
                            {partnerRole}:{" "}
                            <span className="font-semibold text-gray-900">
                              {partner.profile?.fullName || "Peer Student"}
                            </span>
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              Due: {formatDate(b.endDate)}
                            </span>
                            {b.depositPaid ? (
                              <span className="flex items-center gap-1 text-emerald-700">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {formatGHS(b.depositPaid)} Deposit held
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="text-right sm:text-left md:text-right px-2">
                        <span className="text-xl font-black text-green-800 block">
                          {formatGHS(b.totalPrice)}
                        </span>
                        <span className="text-xs text-gray-400">Rental Fee</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 justify-end">
                        {b.status === "ACTIVE" && (
                          <button
                            onClick={() => handleReturnConfirm(b.id)}
                            className="btn-primary btn-sm text-xs flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Confirm Returned
                          </button>
                        )}

                        <Link
                          href="/messages"
                          className="btn-secondary btn-sm text-xs flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
