"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Heart,
  MapPin,
  Star,
  CheckCircle,
  Eye,
  Share2,
  Flag,
  MessageCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Tag,
  Shield,
} from "lucide-react"
import {
  cn,
  formatGHS,
  formatDate,
  formatRelativeDate,
  getConditionLabel,
  getListingTypeLabel,
  getInitials,
} from "@/lib/utils"
import { toast } from "@/components/ui/toaster"

interface ListingDetailClientProps {
  listing: any
}

export default function ListingDetailClient({ listing }: ListingDetailClientProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFav, setIsFav] = useState(listing.isFavourited || false)
  const [favLoading, setFavLoading] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerAmount, setOfferAmount] = useState("")
  const [offerMessage, setOfferMessage] = useState("")
  const [offerLoading, setOfferLoading] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [messageLoading, setMessageLoading] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [borrowStart, setBorrowStart] = useState("")
  const [borrowEnd, setBorrowEnd] = useState("")
  const [borrowMessage, setBorrowMessage] = useState("")
  const [borrowLoading, setBorrowLoading] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDesc, setReportDesc] = useState("")
  const [reportLoading, setReportLoading] = useState(false)

  const isOwnListing = session?.user?.id === listing.seller.id
  const isActive = listing.status === "ACTIVE"

  const images = listing.images || []
  const currentImage = images[currentImageIndex]

  const typeColors: Record<string, string> = {
    SELL: "bg-green-100 text-green-800",
    EXCHANGE: "bg-blue-100 text-blue-800",
    LEND: "bg-purple-100 text-purple-800",
    GIVEAWAY: "bg-yellow-100 text-yellow-800",
  }

  async function toggleFavourite() {
    if (!session) {
      router.push("/login")
      return
    }
    setFavLoading(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}/favourite`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setIsFav(data.data.isFavourited)
        toast({ title: data.data.isFavourited ? "Saved!" : "Removed", variant: "success" })
      }
    } finally {
      setFavLoading(false)
    }
  }

  async function submitOffer() {
    if (!session) { router.push("/login"); return }
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid offer amount.", variant: "error" })
      return
    }
    setOfferLoading(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(offerAmount), message: offerMessage }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Offer sent! 🎉", description: "The seller will be notified.", variant: "success" })
        setShowOfferModal(false)
        setOfferAmount("")
        setOfferMessage("")
      } else {
        toast({ title: "Error", description: data.error, variant: "error" })
      }
    } finally {
      setOfferLoading(false)
    }
  }

  async function sendMessage() {
    if (!session) { router.push("/login"); return }
    setMessageLoading(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: listing.seller.id,
          listingId: listing.id,
          initialMessage: messageText || `Hi, I'm interested in your listing "${listing.title}". Is it still available?`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/messages/${data.data.conversationId}`)
      }
    } finally {
      setMessageLoading(false)
    }
  }

  async function submitBorrow() {
    if (!session) { router.push("/login"); return }
    if (!borrowStart || !borrowEnd) {
      toast({ title: "Error", description: "Please select both start and end dates.", variant: "error" })
      return
    }
    setBorrowLoading(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: borrowStart, endDate: borrowEnd, message: borrowMessage }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Request sent!", description: "The lender will be notified.", variant: "success" })
        setShowBorrowModal(false)
      } else {
        toast({ title: "Error", description: data.error, variant: "error" })
      }
    } finally {
      setBorrowLoading(false)
    }
  }

  async function submitReport() {
    if (!session) { router.push("/login"); return }
    if (!reportReason) {
      toast({ title: "Error", description: "Please select a reason.", variant: "error" })
      return
    }
    setReportLoading(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, reason: reportReason, description: reportDesc }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Report submitted", description: "We will review this listing.", variant: "success" })
        setShowReportModal(false)
      }
    } finally {
      setReportLoading(false)
    }
  }

  async function shareLink() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: listing.title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copied!", variant: "success" })
    }
  }

  const priceDisplay = () => {
    if (listing.isFree || listing.priceType === "FREE") return "Free"
    if (listing.priceType === "CONTACT") return "Contact seller"
    if (listing.price === null) return "N/A"
    return `GH₵ ${listing.price.toLocaleString()}`
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container-main py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="card overflow-hidden">
              <div className="relative aspect-square md:aspect-[4/3] bg-gray-100">
                {currentImage ? (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.altText || listing.title}
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                )}

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                      disabled={currentImageIndex === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => Math.min(images.length - 1, i + 1))}
                      disabled={currentImageIndex === images.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            i === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Status Badge */}
                {listing.status !== "ACTIVE" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white text-gray-900 font-bold text-xl px-6 py-2 rounded-full uppercase">
                      {listing.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img: any, i: number) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(i)}
                      className={cn(
                        "w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all",
                        i === currentImageIndex ? "border-green-700" : "border-transparent"
                      )}
                    >
                      <Image src={img.url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Info */}
            <div className="card card-body">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={cn("badge", typeColors[listing.type] || "badge-gray")}>
                  {getListingTypeLabel(listing.type)}
                </span>
                <span className="badge badge-gray">{getConditionLabel(listing.condition)}</span>
                {listing.isFeatured && <span className="badge bg-yellow-100 text-yellow-800">⭐ Featured</span>}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">{listing.title}</h1>

              {/* Price */}
              <div className="mb-4">
                <div className={cn(
                  "text-3xl font-bold",
                  listing.isFree || listing.priceType === "FREE" ? "text-emerald-600" : "text-green-800"
                )}>
                  {priceDisplay()}
                </div>
                {listing.isNegotiable && (
                  <span className="text-sm text-gray-500 mt-0.5">· Negotiable</span>
                )}
                {listing.type === "LEND" && listing.dailyRate && (
                  <div className="text-sm text-purple-700 mt-1">
                    GH₵{listing.dailyRate}/day
                    {listing.weeklyRate && ` · GH₵${listing.weeklyRate}/week`}
                    {listing.deposit && ` · GH₵${listing.deposit} deposit`}
                  </div>
                )}
                {listing.type === "EXCHANGE" && listing.exchangeFor && (
                  <div className="text-sm text-blue-700 mt-1">
                    💱 Exchange for: {listing.exchangeFor}
                    {listing.exchangeExtra && ` + GH₵${listing.exchangeExtra}`}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-5">
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {listing.institution && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-gray-500">Institution</div>
                      <div className="font-medium text-gray-900">
                        {listing.institution.shortName || listing.institution.name}
                      </div>
                    </div>
                  </div>
                )}
                {listing.campus && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-gray-500">Campus</div>
                      <div className="font-medium text-gray-900">{listing.campus.name}</div>
                    </div>
                  </div>
                )}
                {listing.area && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-gray-500">Area</div>
                      <div className="font-medium text-gray-900">{listing.area}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-gray-500">Listed</div>
                    <div className="font-medium text-gray-900">{formatRelativeDate(listing.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Eye className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-gray-500">Views</div>
                    <div className="font-medium text-gray-900">{listing.views.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {listing.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1 badge badge-gray">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Safety Tips */}
            <div className="card card-body bg-green-50 border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-700" />
                <h3 className="font-bold text-green-900">Safety Tips</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-green-800">
                <li>• Meet in a public campus location.</li>
                <li>• Inspect the item before completing a transaction.</li>
                <li>• Never share OTPs, passwords, or sensitive information.</li>
                <li>• Be cautious of unusually low prices — they may indicate a scam.</li>
              </ul>
            </div>
          </div>

          {/* Right — Actions + Seller */}
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="card card-body space-y-3">
              {!isOwnListing && isActive ? (
                <>
                  {listing.type === "SELL" && (
                    <>
                      <button
                        onClick={() => session ? setShowOfferModal(true) : router.push("/login")}
                        className="btn-primary btn-lg w-full"
                      >
                        Make an Offer
                      </button>
                      <button
                        onClick={() => session ? setShowMessageModal(true) : router.push("/login")}
                        className="btn-secondary btn-lg w-full"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message Seller
                      </button>
                    </>
                  )}
                  {listing.type === "LEND" && (
                    <>
                      <button
                        onClick={() => session ? setShowBorrowModal(true) : router.push("/login")}
                        className="btn-primary btn-lg w-full"
                      >
                        Request to Borrow
                      </button>
                      <button
                        onClick={() => session ? setShowMessageModal(true) : router.push("/login")}
                        className="btn-secondary btn-lg w-full"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message Lender
                      </button>
                    </>
                  )}
                  {listing.type === "EXCHANGE" && (
                    <>
                      <button
                        onClick={() => session ? setShowMessageModal(true) : router.push("/login")}
                        className="btn-primary btn-lg w-full"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Propose Exchange
                      </button>
                    </>
                  )}
                  {listing.type === "GIVEAWAY" && (
                    <button
                      onClick={() => session ? setShowMessageModal(true) : router.push("/login")}
                      className="btn-primary btn-lg w-full"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Request Item
                    </button>
                  )}
                </>
              ) : isOwnListing ? (
                <Link href={`/my-listings/${listing.id}/edit`} className="btn-secondary btn-lg w-full text-center">
                  Edit Listing
                </Link>
              ) : (
                <div className="text-center py-3 text-gray-500 text-sm bg-gray-50 rounded-xl">
                  This listing is no longer available.
                </div>
              )}

              {/* Secondary actions */}
              <div className="flex gap-2">
                <button
                  onClick={toggleFavourite}
                  disabled={favLoading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    isFav
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                  {isFav ? "Saved" : "Save"}
                </button>
                <button
                  onClick={shareLink}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 bg-white transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                {!isOwnListing && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 text-sm text-gray-400 hover:text-red-500 hover:border-red-200 bg-white transition-all"
                    title="Report listing"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <div className="card card-body">
              <h3 className="font-bold text-gray-900 mb-3">Seller</h3>
              <Link
                href={`/user/${listing.seller.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="avatar w-12 h-12 text-sm">
                  {listing.seller.profile?.avatarUrl ? (
                    <Image
                      src={listing.seller.profile.avatarUrl}
                      alt={listing.seller.profile?.fullName || ""}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(listing.seller.profile?.fullName || "U")
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">
                      {listing.seller.profile?.fullName}
                    </span>
                    {listing.seller.verificationStatus !== "UNVERIFIED" && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  {listing.seller.profile?.institution && (
                    <div className="text-xs text-gray-500">
                      {listing.seller.profile.institution.name}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {listing.seller.profile?.ratingCount > 0 ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={cn(
                              "w-3 h-3",
                              s <= Math.round(listing.seller.profile.averageRating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            )}
                          />
                        ))}
                        <span className="text-xs text-gray-500">
                          ({listing.seller.profile.ratingCount})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No ratings yet</span>
                    )}
                  </div>
                </div>
              </Link>

              {listing.seller.profile?.completedTransactions > 0 && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  ✅ {listing.seller.profile.completedTransactions} completed transactions
                </div>
              )}

              {listing.seller.profile?.bio && (
                <p className="text-sm text-gray-600 mt-3 italic">"{listing.seller.profile.bio}"</p>
              )}
            </div>

            {/* Stats */}
            <div className="card card-body">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900">{listing.views}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{listing._count?.favourites || 0}</div>
                  <div className="text-xs text-gray-500">Saved</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{listing._count?.offers || 0}</div>
                  <div className="text-xs text-gray-500">Offers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Offer Modal */}
      {showOfferModal && (
        <Modal title="Make an Offer" onClose={() => setShowOfferModal(false)}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Listed price</p>
              <p className="text-2xl font-bold text-green-800">
                {listing.price !== null ? `GH₵ ${listing.price.toLocaleString()}` : "Contact seller"}
              </p>
            </div>
            <div>
              <label className="label">Your offer (GH₵)</label>
              <input
                type="number"
                value={offerAmount}
                onChange={e => setOfferAmount(e.target.value)}
                placeholder="Enter your offer amount"
                className="input"
                min={1}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Message (optional)</label>
              <textarea
                value={offerMessage}
                onChange={e => setOfferMessage(e.target.value)}
                placeholder="E.g. I can pick it up today..."
                className="input min-h-[80px]"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOfferModal(false)} className="btn-ghost btn-md flex-1">Cancel</button>
              <button onClick={submitOffer} disabled={offerLoading || !offerAmount} className="btn-primary btn-md flex-1">
                {offerLoading ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <Modal title="Message Seller" onClose={() => setShowMessageModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Message</label>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={`Hi, I'm interested in your listing "${listing.title}". Is it still available?`}
                className="input min-h-[120px]"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMessageModal(false)} className="btn-ghost btn-md flex-1">Cancel</button>
              <button onClick={sendMessage} disabled={messageLoading} className="btn-primary btn-md flex-1">
                {messageLoading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Borrow Modal */}
      {showBorrowModal && (
        <Modal title="Request to Borrow" onClose={() => setShowBorrowModal(false)}>
          <div className="space-y-4">
            {listing.dailyRate && (
              <div className="bg-purple-50 rounded-xl p-3 text-sm">
                <p className="font-semibold text-purple-800">GH₵{listing.dailyRate}/day</p>
                {listing.deposit && <p className="text-purple-600">Deposit: GH₵{listing.deposit}</p>}
                {listing.lendingTerms && <p className="text-purple-600 mt-1">{listing.lendingTerms}</p>}
              </div>
            )}
            <div>
              <label className="label">Start date</label>
              <input type="date" value={borrowStart} onChange={e => setBorrowStart(e.target.value)} className="input" min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="label">Return date</label>
              <input type="date" value={borrowEnd} onChange={e => setBorrowEnd(e.target.value)} className="input" min={borrowStart || new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="label">Message (optional)</label>
              <textarea value={borrowMessage} onChange={e => setBorrowMessage(e.target.value)} placeholder="Anything you'd like the lender to know..." className="input min-h-[80px]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBorrowModal(false)} className="btn-ghost btn-md flex-1">Cancel</button>
              <button onClick={submitBorrow} disabled={borrowLoading || !borrowStart || !borrowEnd} className="btn-primary btn-md flex-1">
                {borrowLoading ? "Sending..." : "Request to Borrow"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <Modal title="Report Listing" onClose={() => setShowReportModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Reason</label>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="select">
                <option value="">Select a reason</option>
                <option value="SCAM">Scam</option>
                <option value="FRAUD">Fraud</option>
                <option value="FAKE_ITEM">Fake / Counterfeit Item</option>
                <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="SPAM">Spam</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Additional details (optional)</label>
              <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Please describe the issue..." className="input min-h-[80px]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(false)} className="btn-ghost btn-md flex-1">Cancel</button>
              <button onClick={submitReport} disabled={reportLoading || !reportReason} className="btn-danger btn-md flex-1">
                {reportLoading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-icon btn-ghost text-gray-400">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
