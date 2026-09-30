"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import ListingCard from "@/components/marketplace/listing-card"
import Link from "next/link"
import { Heart, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import { MOCK_LISTINGS } from "@/lib/mock-data"

export default function FavouritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [savedListings, setSavedListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/favourites")
      return
    }

    if (session?.user?.id) {
      fetchFavourites()
    }
  }, [session, status])

  const fetchFavourites = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/users/favourites")
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        setSavedListings(data.data.map((f: any) => f.listing || f))
      } else {
        // Fallback to sample items for demo
        setSavedListings(MOCK_LISTINGS.slice(0, 4))
      }
    } catch {
      setSavedListings(MOCK_LISTINGS.slice(0, 4))
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (listingId: string) => {
    setSavedListings((prev) => prev.filter((l) => l.id !== listingId))
    fetch(`/api/listings/${listingId}/favourite`, { method: "POST" }).catch(() => {})
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container-main max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold text-gray-900">Saved Items</h1>
                <span className="badge badge-green font-bold text-xs">
                  {savedListings.length} Saved
                </span>
              </div>
              <p className="text-gray-500 mt-1">
                Keep track of items you are interested in buying, swapping, or borrowing.
              </p>
            </div>

            <Link href="/marketplace" className="btn-secondary btn-md shrink-0 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Browse More Items
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-800 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading saved items...</p>
            </div>
          ) : savedListings.length === 0 ? (
            <div className="card card-body p-12 text-center bg-white border border-gray-100 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No saved items yet</h3>
              <p className="text-sm text-gray-500 mt-2">
                Click the heart icon on any listing in the marketplace to save it here for later.
              </p>
              <div className="mt-6">
                <Link href="/marketplace" className="btn-primary btn-md">
                  Explore Marketplace <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedListings.map((listing) => (
                <div key={listing.id} className="relative group">
                  <ListingCard listing={{ ...listing, isFavourited: true }} />
                  <button
                    onClick={() => handleRemove(listing.id)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Remove from saved"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
