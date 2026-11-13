"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"
import Image from "next/image"
import {
  Tag,
  Check,
  X,
  RotateCcw,
  ArrowRight,
  MessageCircle,
  Clock,
  Loader2,
  TrendingDown,
  ShoppingBag,
  ExternalLink,
} from "lucide-react"
import { formatGHS, formatRelativeDate } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"

interface OfferItem {
  id: string
  amount: number
  message?: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "WITHDRAWN"
  createdAt: string
  listing: {
    id: string
    title: string
    slug: string
    price: number
    images: { url: string }[]
  }
  buyer: {
    id: string
    profile: {
      fullName: string
      averageRating: number
      ratingCount: number
    }
  }
  seller: {
    id: string
    profile: {
      fullName: string
      averageRating: number
      ratingCount: number
    }
  }
}

export default function OffersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Counter offer modal/input
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null)
  const [counterAmount, setCounterAmount] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/offers")
      return
    }

    if (session?.user?.id) {
      fetchOffers()
    }
  }, [session, status, activeTab])

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/offers?type=${activeTab}&limit=50`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setOffers(data.data ?? [])
    } catch {
      setOffers([])
      toast({ title: "Couldn't load your offers", description: "Please refresh the page to try again.", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleOfferAction = async (offerId: string, action: "ACCEPTED" | "REJECTED" | "COUNTERED", counterValue?: number) => {
    setActionLoadingId(offerId)
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, counterAmount: counterValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast({
          title: `Offer ${action === "ACCEPTED" ? "accepted" : action === "COUNTERED" ? "countered" : "rejected"}!`,
          variant: "success",
        })
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: action } : o))
        )
        setCounteringOfferId(null)
      } else {
        toast({ title: "Couldn't update the offer", description: data.error || "Please try again.", variant: "error" })
      }
    } catch {
      toast({ title: "Couldn't update the offer", description: "Check your connection and try again.", variant: "error" })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container-main max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Price Offers & Negotiations</h1>
            <p className="text-gray-500 mt-1">
              Review and manage student price bids for your items and check offers you made.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
            <button
              onClick={() => setActiveTab("received")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "received"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              Offers Received (As Seller)
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "sent"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              Offers Sent (As Buyer)
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-800 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="card card-body p-12 text-center bg-white border border-gray-100 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                No {activeTab} offers right now
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {activeTab === "received"
                  ? "When students make price offers on your negotiable listings, they will show up here."
                  : "You haven't submitted any price negotiation offers yet. Find negotiable items in the marketplace!"}
              </p>
              <div className="mt-6">
                <Link href="/marketplace" className="btn-primary btn-md">
                  Explore Marketplace
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                const discount =
                  offer.listing.price > 0
                    ? Math.round(((offer.listing.price - offer.amount) / offer.listing.price) * 100)
                    : 0

                return (
                  <div
                    key={offer.id}
                    className="card card-body p-5 bg-white border border-gray-100 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Product & Buyer Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                          {offer.listing.images?.[0]?.url ? (
                            <Image
                              src={offer.listing.images[0].url}
                              alt={offer.listing.title}
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
                                offer.status === "ACCEPTED"
                                  ? "badge-green"
                                  : offer.status === "REJECTED"
                                  ? "badge-red"
                                  : offer.status === "COUNTERED"
                                  ? "badge-blue"
                                  : "badge-gold"
                              }`}
                            >
                              {offer.status}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeDate(offer.createdAt)}
                            </span>
                          </div>

                          <h3 className="font-bold text-gray-900 text-sm hover:text-green-800 transition-colors">
                            <Link href={`/listing/${offer.listing.slug || offer.listing.id}`}>
                              {offer.listing.title}
                            </Link>
                          </h3>

                          <p className="text-xs text-gray-600 mt-1">
                            From:{" "}
                            <span className="font-semibold text-gray-900">
                              {activeTab === "received"
                                ? offer.buyer.profile?.fullName || "Student Buyer"
                                : offer.seller.profile?.fullName || "Seller"}
                            </span>
                            {" · "}
                            ⭐ {activeTab === "received" ? offer.buyer.profile?.averageRating || 5.0 : offer.seller.profile?.averageRating || 5.0}
                          </p>

                          {offer.message && (
                            <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-gray-700 italic">
                              "{offer.message}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle: Price Comparison */}
                      <div className="text-right sm:text-left md:text-right px-2 py-1 bg-gray-50 md:bg-transparent rounded-xl">
                        <span className="text-xs text-gray-400 line-through block">
                          Original: {formatGHS(offer.listing.price)}
                        </span>
                        <div className="flex items-center md:justify-end gap-1.5 mt-0.5">
                          <span className="text-xl font-black text-green-800">
                            {formatGHS(offer.amount)}
                          </span>
                          {discount > 0 && (
                            <span className="badge badge-gold text-[10px]">
                              -{discount}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      {offer.status === "PENDING" && activeTab === "received" && (
                        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 justify-end">
                          <button
                            onClick={() => handleOfferAction(offer.id, "ACCEPTED")}
                            disabled={actionLoadingId === offer.id}
                            className="btn-primary btn-sm text-xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept
                          </button>

                          <button
                            onClick={() => {
                              setCounteringOfferId(offer.id)
                              setCounterAmount(String(offer.amount + 10))
                            }}
                            disabled={actionLoadingId === offer.id}
                            className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Counter
                          </button>

                          <button
                            onClick={() => handleOfferAction(offer.id, "REJECTED")}
                            disabled={actionLoadingId === offer.id}
                            className="btn-ghost btn-sm text-xs text-red-600 hover:bg-red-50 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      )}

                      {offer.status === "ACCEPTED" && (
                        <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                          <Link href="/messages" className="btn-secondary btn-sm text-xs flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5" />
                            Message to coordinate pickup
                          </Link>
                          {/* Accepting an offer creates a deal; it's completed or cancelled there */}
                          <Link href="/transactions" className="btn-ghost btn-sm text-xs flex items-center gap-1">
                            View deal
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Inline Counter Offer Input */}
                    {counteringOfferId === offer.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-700">Counter Price (GH₵):</span>
                        <input
                          type="number"
                          value={counterAmount}
                          onChange={(e) => setCounterAmount(e.target.value)}
                          className="input w-32 py-1.5 text-sm"
                          min="1"
                        />
                        <button
                          onClick={() => handleOfferAction(offer.id, "COUNTERED", parseFloat(counterAmount))}
                          disabled={actionLoadingId === offer.id}
                          className="btn-primary btn-sm text-xs"
                        >
                          Send Counter Offer
                        </button>
                        <button
                          onClick={() => setCounteringOfferId(null)}
                          className="btn-ghost btn-sm text-xs text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
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
