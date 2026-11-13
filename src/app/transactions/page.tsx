"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"
import Image from "next/image"
import {
  TrendingUp,
  ShoppingBag,
  Star,
  CheckCircle,
  Clock,
  MessageCircle,
  MapPin,
  CreditCard,
  Loader2,
  X,
} from "lucide-react"
import { formatGHS, formatRelativeDate } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"

interface TransactionItem {
  id: string
  type: "PURCHASE" | "EXCHANGE" | "BORROW" | "LEND" | "GIVEAWAY"
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED"
  amount?: number | null
  paymentMethod: string
  notes?: string
  createdAt: string
  completedAt?: string
  listing: {
    id: string
    title: string
    slug: string
    images: { url: string }[]
  }
  buyer: {
    id: string
    profile: {
      fullName: string
      averageRating: number
    }
  }
  seller: {
    id: string
    profile: {
      fullName: string
      averageRating: number
    }
  }
  hasReviewed?: boolean
}

// Deals that can still be completed or cancelled
const OPEN_STATUSES: TransactionItem["status"][] = ["PENDING", "ACCEPTED", "IN_PROGRESS"]

const PAYMENT_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money (MoMo)",
  CASH: "Cash on pickup",
  BANK_TRANSFER: "Bank transfer",
  PLATFORM: "Paid on UniPlug",
}

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"purchases" | "sales">("purchases")
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewTransaction, setReviewTransaction] = useState<TransactionItem | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/transactions")
      return
    }

    if (session?.user?.id) {
      fetchTransactions()
    }
  }, [session, status, activeTab])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?type=${activeTab}&limit=50`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setTransactions(data.data ?? [])
    } catch {
      setTransactions([])
      toast({ title: "Couldn't load your transactions", description: "Please refresh the page to try again.", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  const updateDeal = async (tx: TransactionItem, status: "COMPLETED" | "CANCELLED") => {
    const question =
      status === "COMPLETED"
        ? `Confirm you've received "${tx.listing.title}"? This completes the deal and marks the item as sold.`
        : `Cancel the deal for "${tx.listing.title}"? The item goes back on the market.`
    if (!confirm(question)) return

    setActionLoadingId(tx.id)
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: data.message || "Deal updated", variant: "success" })
        setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, status } : t)))
      } else {
        toast({ title: "Couldn't update the deal", description: data.error || "Please try again.", variant: "error" })
      }
    } catch {
      toast({ title: "Couldn't update the deal", description: "Check your connection and try again.", variant: "error" })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewTransaction) return
    setReviewSubmitting(true)

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: reviewTransaction.id,
          rating,
          comment,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({ title: "Review submitted successfully!", variant: "success" })
        setTransactions((prev) =>
          prev.map((t) => (t.id === reviewTransaction.id ? { ...t, hasReviewed: true } : t))
        )
        setReviewModalOpen(false)
        setComment("")
      } else {
        // Keep the modal open so the user doesn't lose what they wrote
        toast({ title: "Couldn't submit your review", description: data.error || "Please try again.", variant: "error" })
      }
    } catch {
      toast({ title: "Couldn't submit your review", description: "Check your connection and try again.", variant: "error" })
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container-main max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Transaction History</h1>
            <p className="text-gray-500 mt-1">
              Track completed deals, ongoing item rentals, receipts, and peer trust ratings.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
            <button
              onClick={() => setActiveTab("purchases")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "purchases"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              My Purchases & Borrows
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "sales"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              My Sales & Loans
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-800 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="card card-body p-12 text-center bg-white border border-gray-100 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No transaction records yet</h3>
              <p className="text-sm text-gray-500 mt-2">
                When you agree to buy or sell items on campus, completed deals and receipts will appear here.
              </p>
              <div className="mt-6">
                <Link href="/marketplace" className="btn-primary btn-md">
                  Browse Campus Marketplace
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const otherParty = activeTab === "purchases" ? tx.seller : tx.buyer
                const isBorrow = tx.type === "BORROW"
                const otherRole =
                  activeTab === "purchases" ? (isBorrow ? "Lender" : "Seller") : isBorrow ? "Borrower" : "Buyer"
                const isOpen = OPEN_STATUSES.includes(tx.status)
                const busy = actionLoadingId === tx.id

                return (
                  <div
                    key={tx.id}
                    className="card card-body p-5 bg-white border border-gray-100 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Product thumbnail + details */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                          {tx.listing.images?.[0]?.url ? (
                            <Image
                              src={tx.listing.images[0].url}
                              alt={tx.listing.title}
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
                                tx.status === "COMPLETED"
                                  ? "badge-green"
                                  : tx.status === "IN_PROGRESS"
                                  ? "badge-blue"
                                  : tx.status === "CANCELLED" || tx.status === "DISPUTED"
                                  ? "badge-red"
                                  : "badge-gold"
                              }`}
                            >
                              {tx.status.replace("_", " ")}
                            </span>
                            <span className="badge badge-purple uppercase text-[10px]">
                              {tx.type}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeDate(tx.createdAt)}
                            </span>
                          </div>

                          <h3 className="font-bold text-gray-900 text-sm hover:text-green-800 transition-colors">
                            <Link href={`/listing/${tx.listing.slug || tx.listing.id}`}>
                              {tx.listing.title}
                            </Link>
                          </h3>

                          <p className="text-xs text-gray-600 mt-1">
                            {otherRole}:{" "}
                            <span className="font-semibold text-gray-900">
                              {otherParty.profile?.fullName || "Peer Student"}
                            </span>
                            {" · "}
                            ⭐ {otherParty.profile?.averageRating || 5.0}
                          </p>

                          {tx.notes && (
                            <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded-lg p-2 text-gray-600 flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                              <span>{tx.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment & Amount */}
                      <div className="text-right sm:text-left md:text-right px-2">
                        <span className="text-2xl font-black text-green-800 block">
                          {formatGHS(tx.amount)}
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center md:justify-end gap-1 mt-0.5">
                          <CreditCard className="w-3 h-3 text-gray-400" />
                          {PAYMENT_LABELS[tx.paymentMethod] || "Payment method not set"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 justify-end">
                        {/* Borrowing deals move with the borrowing itself (hand over → return) */}
                        {isOpen && isBorrow && (
                          <Link href="/borrowings" className="btn-secondary btn-sm text-xs">
                            Manage in Borrowings
                          </Link>
                        )}

                        {/* Only the buyer confirms the item changed hands */}
                        {isOpen && !isBorrow && activeTab === "purchases" && (
                          <button
                            onClick={() => updateDeal(tx, "COMPLETED")}
                            disabled={busy}
                            className="btn-primary btn-sm text-xs flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            I received it
                          </button>
                        )}

                        {isOpen && !isBorrow && activeTab === "sales" && (
                          <span className="text-[11px] text-gray-500">Waiting for the buyer to confirm receipt</span>
                        )}

                        {isOpen && !isBorrow && (
                          <button
                            onClick={() => updateDeal(tx, "CANCELLED")}
                            disabled={busy}
                            className="btn-ghost btn-sm text-xs text-red-600 hover:bg-red-50 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel deal
                          </button>
                        )}

                        {tx.status === "COMPLETED" && (
                          <button
                            onClick={() => {
                              setReviewTransaction(tx)
                              setReviewModalOpen(true)
                            }}
                            disabled={tx.hasReviewed}
                            className={`btn-sm text-xs flex items-center gap-1.5 ${
                              tx.hasReviewed
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "btn-secondary"
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                            {tx.hasReviewed ? "Reviewed" : "Leave Review"}
                          </button>
                        )}

                        <Link
                          href="/messages"
                          className="btn-ghost btn-sm text-xs flex items-center gap-1 text-gray-600"
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

          {/* LEAVE REVIEW MODAL */}
          {reviewModalOpen && reviewTransaction && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900">Rate Your Experience</h3>
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">
                      How was trading with{" "}
                      {(activeTab === "purchases" ? reviewTransaction.seller : reviewTransaction.buyer).profile
                        ?.fullName || "this student"}
                      ?
                    </label>
                    <div className="flex items-center gap-2 justify-center py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-2xl transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-xs font-bold text-gray-600">
                      {rating === 5 && "⭐ Excellent - Trustworthy student!"}
                      {rating === 4 && "⭐ Great experience"}
                      {rating === 3 && "⭐ Average"}
                      {rating <= 2 && "⚠️ Needs improvement"}
                    </p>
                  </div>

                  <div>
                    <label className="label">Feedback Comments</label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Was the item in good condition? Punctual at campus meetup spot? Friendly communication?"
                      className="input resize-none text-sm"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(false)}
                      className="btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="btn-primary btn-sm flex items-center gap-1.5"
                    >
                      {reviewSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Submit Review
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
