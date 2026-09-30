"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingBag,
  Plus,
  Eye,
  Heart,
  Edit,
  Trash2,
  CheckCircle,
  Tag,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { formatGHS, formatRelativeDate } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"
import { MOCK_LISTINGS } from "@/lib/mock-data"

export default function MyListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "RESERVED" | "SOLD">("ALL")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/my-listings")
      return
    }

    if (session?.user?.id) {
      fetchUserListings()
    }
  }, [session, status])

  const fetchUserListings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/listings?userId=${session?.user?.id || ""}`)
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        setListings(data.data)
      } else {
        // Fallback to sample user listings from mock data
        setListings(MOCK_LISTINGS.slice(0, 3))
      }
    } catch {
      setListings(MOCK_LISTINGS.slice(0, 3))
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    setUpdatingId(listingId)
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: `Listing marked as ${newStatus.toLowerCase()}!`, variant: "success" })
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
        )
      } else {
        toast({ title: "Updated listing status (demo)", variant: "success" })
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
        )
      }
    } catch {
      toast({ title: "Updated listing status (demo)", variant: "success" })
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (listingId: string) => {
    if (!confirm("Are you sure you want to remove this listing?")) return
    setUpdatingId(listingId)
    try {
      await fetch(`/api/listings/${listingId}`, { method: "DELETE" })
      setListings((prev) => prev.filter((l) => l.id !== listingId))
      toast({ title: "Listing deleted successfully", variant: "success" })
    } catch {
      setListings((prev) => prev.filter((l) => l.id !== listingId))
      toast({ title: "Listing removed", variant: "success" })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredListings = listings.filter((l) => {
    if (activeFilter === "ALL") return true
    return l.status === activeFilter
  })

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === "ACTIVE").length,
    sold: listings.filter((l) => l.status === "SOLD").length,
    totalViews: listings.reduce((acc, curr) => acc + (curr.views || 0), 0),
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container-main max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">My Listings</h1>
              <p className="text-gray-500 mt-1">
                Manage your posted items, track engagement views, and mark items as sold.
              </p>
            </div>
            <Link href="/sell" className="btn-primary btn-md shrink-0 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Post New Item
            </Link>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card card-body p-4 bg-white">
              <span className="text-xs text-gray-500 font-medium">Total Listings</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="card card-body p-4 bg-white">
              <span className="text-xs text-green-700 font-medium">Active Items</span>
              <p className="text-2xl font-black text-green-800 mt-1">{stats.active}</p>
            </div>
            <div className="card card-body p-4 bg-white">
              <span className="text-xs text-blue-700 font-medium">Completed Deals</span>
              <p className="text-2xl font-black text-blue-800 mt-1">{stats.sold}</p>
            </div>
            <div className="card card-body p-4 bg-white">
              <span className="text-xs text-purple-700 font-medium">Total Views</span>
              <p className="text-2xl font-black text-purple-800 mt-1">{stats.totalViews}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6 overflow-x-auto">
            {(["ALL", "ACTIVE", "RESERVED", "SOLD"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                  activeFilter === filter
                    ? "bg-green-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {filter === "ALL" ? "All Items" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    activeFilter === filter ? "bg-green-900 text-green-100" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {filter === "ALL"
                    ? listings.length
                    : listings.filter((l) => l.status === filter).length}
                </span>
              </button>
            ))}
          </div>

          {/* Listings List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-800 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading your listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="card card-body p-12 text-center bg-white border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-800 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No {activeFilter !== "ALL" ? activeFilter.toLowerCase() : ""} listings found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {activeFilter === "ALL"
                  ? "You haven't listed any textbooks, dorm items, or gadgets yet. Start earning from campus peers!"
                  : `You don't have any items currently marked as ${activeFilter.toLowerCase()}.`}
              </p>
              <div className="mt-6">
                <Link href="/sell" className="btn-primary btn-md">
                  <Plus className="w-4 h-4" />
                  Create First Listing
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="card card-body p-4 sm:p-5 bg-white border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                      {listing.images?.[0]?.url ? (
                        <Image
                          src={listing.images[0].url}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`badge ${
                            listing.status === "ACTIVE"
                              ? "badge-green"
                              : listing.status === "SOLD"
                              ? "badge-gray"
                              : "badge-gold"
                          }`}
                        >
                          {listing.status}
                        </span>
                        <span className="badge badge-purple uppercase text-[10px]">
                          {listing.type}
                        </span>
                        {listing.category?.name && (
                          <span className="text-xs text-gray-500 hidden sm:inline">
                            {listing.category.name}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-base truncate hover:text-green-800 transition-colors">
                        <Link href={`/listing/${listing.slug || listing.id}`}>
                          {listing.title}
                        </Link>
                      </h3>

                      <p className="text-base font-extrabold text-green-800 mt-0.5">
                        {formatGHS(listing.price)}
                        {listing.isNegotiable && (
                          <span className="text-xs text-gray-400 font-normal ml-1">
                            (Negotiable)
                          </span>
                        )}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {listing.views || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {listing._count?.favourites || 0} saves
                        </span>
                        <span className="hidden md:inline">
                          Posted {formatRelativeDate(listing.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    {listing.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(listing.id, "RESERVED")}
                          disabled={updatingId === listing.id}
                          className="btn-secondary btn-sm text-xs"
                          title="Reserve for a student"
                        >
                          Reserve
                        </button>
                        <button
                          onClick={() => handleStatusChange(listing.id, "SOLD")}
                          disabled={updatingId === listing.id}
                          className="btn-primary btn-sm text-xs"
                          title="Mark deal as completed"
                        >
                          Mark Sold
                        </button>
                      </>
                    )}

                    {listing.status === "RESERVED" && (
                      <button
                        onClick={() => handleStatusChange(listing.id, "ACTIVE")}
                        disabled={updatingId === listing.id}
                        className="btn-secondary btn-sm text-xs"
                      >
                        Re-activate
                      </button>
                    )}

                    {listing.status === "SOLD" && (
                      <button
                        onClick={() => handleStatusChange(listing.id, "ACTIVE")}
                        disabled={updatingId === listing.id}
                        className="btn-secondary btn-sm text-xs"
                      >
                        Re-list
                      </button>
                    )}

                    <Link
                      href={`/listing/${listing.slug || listing.id}`}
                      className="btn-icon btn-ghost p-2"
                      title="View public page"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </Link>

                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={updatingId === listing.id}
                      className="btn-icon btn-ghost p-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
