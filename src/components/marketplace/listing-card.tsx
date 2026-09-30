"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, MapPin, Star, CheckCircle, Eye } from "lucide-react"
import { useState } from "react"
import { cn, formatGHS, formatRelativeDate, getConditionLabel, getListingTypeLabel } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { toast } from "@/components/ui/toaster"

interface ListingCardProps {
  listing: {
    id: string
    title: string
    slug: string
    price: number | null
    priceType: string
    isFree: boolean
    isNegotiable: boolean
    type: string
    condition: string
    status: string
    views: number
    isFavourited?: boolean
    createdAt: string | Date
    images: Array<{ url: string; isPrimary: boolean; altText?: string | null }>
    seller: {
      id: string
      verificationStatus: string
      profile: {
        fullName: string
        avatarUrl: string | null
        averageRating: number
        ratingCount: number
      } | null
    }
    institution?: { name: string; shortName: string | null } | null
    campus?: { name: string } | null
    category?: { name: string; icon: string | null; color: string | null }
    _count?: { favourites: number }
  }
  className?: string
  showSeller?: boolean
}

export default function ListingCard({ listing, className, showSeller = true }: ListingCardProps) {
  const { data: session } = useSession()
  const [isFav, setIsFav] = useState(listing.isFavourited || false)
  const [favLoading, setFavLoading] = useState(false)

  const primaryImage = listing.images.find((img) => img.isPrimary) || listing.images[0]
  const location = listing.campus?.name || listing.institution?.shortName || listing.institution?.name

  async function toggleFavourite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      toast({ title: "Please sign in", description: "You need to be signed in to save listings.", variant: "warning" })
      return
    }

    setFavLoading(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}/favourite`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setIsFav(data.data.isFavourited)
        toast({
          title: data.data.isFavourited ? "Saved!" : "Removed",
          description: data.data.isFavourited ? "Added to your favourites." : "Removed from favourites.",
          variant: "success",
        })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "error" })
    } finally {
      setFavLoading(false)
    }
  }

  const priceDisplay = () => {
    if (listing.isFree || listing.priceType === "FREE") return "Free"
    if (listing.priceType === "CONTACT") return "Contact seller"
    if (listing.price === null) return "N/A"
    const formatted = formatGHS(listing.price)
    return listing.isNegotiable ? `${formatted} (Negotiable)` : formatted
  }

  const typeColors: Record<string, string> = {
    SELL: "bg-green-100 text-green-800",
    EXCHANGE: "bg-blue-100 text-blue-800",
    LEND: "bg-purple-100 text-purple-800",
    GIVEAWAY: "bg-yellow-100 text-yellow-800",
  }

  const conditionColors: Record<string, string> = {
    NEW: "bg-emerald-100 text-emerald-800",
    LIKE_NEW: "bg-teal-100 text-teal-800",
    GOOD: "bg-sky-100 text-sky-800",
    FAIR: "bg-orange-100 text-orange-800",
    USED: "bg-gray-100 text-gray-700",
  }

  return (
    <Link href={`/listing/${listing.slug}`} className={cn("listing-card group block", className)}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText || listing.title}
            fill
            className="listing-card-image"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl">📦</span>
          </div>
        )}

        {/* Favourite Button */}
        <button
          onClick={toggleFavourite}
          disabled={favLoading}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
            isFav
              ? "bg-red-500 text-white"
              : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white"
          )}
        >
          <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
        </button>

        {/* Type Badge */}
        <div className="absolute bottom-2 left-2">
          <span className={cn("badge text-[10px] font-semibold shadow-sm", typeColors[listing.type] || "bg-gray-100 text-gray-700")}>
            {getListingTypeLabel(listing.type)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight mb-1.5 group-hover:text-green-800 transition-colors">
          {listing.title}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "font-bold text-base",
            listing.isFree || listing.priceType === "FREE" ? "text-emerald-600" : "text-green-800"
          )}>
            {listing.isFree || listing.priceType === "FREE" ? "Free" : listing.price !== null ? `GH₵ ${listing.price.toLocaleString()}` : "N/A"}
          </span>
          <span className={cn("badge text-[10px]", conditionColors[listing.condition] || "bg-gray-100 text-gray-700")}>
            {getConditionLabel(listing.condition)}
          </span>
        </div>

        {/* Seller & Location */}
        {showSeller && listing.seller.profile && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="avatar w-5 h-5 text-[9px] bg-green-100 text-green-800 shrink-0">
              {listing.seller.profile.avatarUrl ? (
                <Image
                  src={listing.seller.profile.avatarUrl}
                  alt={listing.seller.profile.fullName}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              ) : (
                listing.seller.profile.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-xs text-gray-500 truncate">{listing.seller.profile.fullName}</span>
            {listing.seller.verificationStatus !== "UNVERIFIED" && (
              <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
            )}
            {listing.seller.profile.ratingCount > 0 && (
              <div className="flex items-center gap-0.5 ml-auto shrink-0">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-500">
                  {listing.seller.profile.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Location & Date */}
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          {location ? (
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          ) : (
            <span />
          )}
          <span className="shrink-0">{formatRelativeDate(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
