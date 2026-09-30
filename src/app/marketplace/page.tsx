"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import ListingCard from "@/components/marketplace/listing-card"
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  subcategories?: { id: string; name: string; slug: string }[]
}

interface Institution {
  id: string
  name: string
  shortName: string | null
  slug: string
}

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const q = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const type = searchParams.get("type") || ""
  const condition = searchParams.get("condition") || ""
  const institution = searchParams.get("institution") || ""
  const sortBy = searchParams.get("sortBy") || "newest"
  const page = parseInt(searchParams.get("page") || "1")
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""

  const [searchInput, setSearchInput] = useState(q)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (category) params.set("category", category)
      if (type) params.set("type", type)
      if (condition) params.set("condition", condition)
      if (institution) params.set("institution", institution)
      if (minPrice) params.set("minPrice", minPrice)
      if (maxPrice) params.set("maxPrice", maxPrice)
      params.set("sortBy", sortBy)
      params.set("page", page.toString())
      params.set("limit", "20")

      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      if (data.success) {
        setListings(data.data)
        setTotal(data.meta?.total || 0)
        setTotalPages(data.meta?.totalPages || 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [q, category, type, condition, institution, minPrice, maxPrice, sortBy, page])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  useEffect(() => {
    // Load categories and institutions
    fetch("/api/categories").then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data)
    })
    fetch("/api/institutions").then(r => r.json()).then(d => {
      if (d.success) setInstitutions(d.data)
    })
  }, [])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`/marketplace?${params}`)
  }

  const clearFilters = () => {
    router.push("/marketplace")
  }

  const hasFilters = q || category || type || condition || institution || minPrice || maxPrice

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("q", searchInput)
  }

  const types = [
    { value: "SELL", label: "For Sale" },
    { value: "EXCHANGE", label: "Exchange" },
    { value: "LEND", label: "For Rent/Lend" },
    { value: "GIVEAWAY", label: "Free / Giveaway" },
  ]

  const conditions = [
    { value: "NEW", label: "New" },
    { value: "LIKE_NEW", label: "Like New" },
    { value: "GOOD", label: "Good" },
    { value: "FAIR", label: "Fair" },
    { value: "USED", label: "Used" },
  ]

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Viewed" },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-main py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Marketplace</h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search textbooks, laptops, clothes..."
                  className="input pl-9"
                />
              </div>
              <button type="submit" className="btn-primary btn-md shrink-0">Search</button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "btn-md shrink-0 flex items-center gap-2 rounded-xl border font-semibold transition-all",
                  showFilters
                    ? "bg-green-50 border-green-600 text-green-800"
                    : "bg-white border-gray-200 text-gray-700 hover:border-green-400"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasFilters && <span className="w-2 h-2 bg-green-600 rounded-full" />}
              </button>
            </form>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button
                  key={t.value}
                  onClick={() => updateFilter("type", type === t.value ? "" : t.value)}
                  className={cn("filter-chip", type === t.value && "filter-chip-active")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container-main py-6">
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <aside className={cn(
              "shrink-0 transition-all",
              showFilters ? "w-64 block" : "hidden"
            )}>
              <div className="card p-4 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Filters</h3>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>

                {/* Category */}
                <div className="mb-5">
                  <label className="label">Category</label>
                  <select
                    value={category}
                    onChange={e => updateFilter("category", e.target.value)}
                    className="select"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Condition */}
                <div className="mb-5">
                  <label className="label">Condition</label>
                  <div className="space-y-2">
                    {conditions.map(c => (
                      <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="condition"
                          value={c.value}
                          checked={condition === c.value}
                          onChange={() => updateFilter("condition", condition === c.value ? "" : c.value)}
                          className="accent-green-700"
                        />
                        <span className="text-sm text-gray-700">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-5">
                  <label className="label">Price (GH₵)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={e => updateFilter("minPrice", e.target.value)}
                      className="input text-sm"
                      min={0}
                    />
                    <span className="text-gray-400">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={e => updateFilter("maxPrice", e.target.value)}
                      className="input text-sm"
                      min={0}
                    />
                  </div>
                </div>

                {/* Institution */}
                <div className="mb-5">
                  <label className="label">Institution</label>
                  <select
                    value={institution}
                    onChange={e => updateFilter("institution", e.target.value)}
                    className="select"
                  >
                    <option value="">All Institutions</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.slug}>
                        {inst.shortName || inst.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Results Bar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {loading ? "Loading..." : `${total.toLocaleString()} listing${total !== 1 ? "s" : ""} found`}
                </p>
                <select
                  value={sortBy}
                  onChange={e => updateFilter("sortBy", e.target.value)}
                  className="select w-auto text-sm py-1.5"
                >
                  {sortOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Listings Grid */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="card overflow-hidden">
                      <div className="skeleton aspect-square" />
                      <div className="p-3 space-y-2">
                        <div className="skeleton h-4 w-3/4 rounded" />
                        <div className="skeleton h-5 w-1/2 rounded" />
                        <div className="skeleton h-3 w-full rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {listings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => updateFilter("page", String(page - 1))}
                        disabled={page <= 1}
                        className="btn-ghost btn-md disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => updateFilter("page", String(page + 1))}
                        disabled={page >= totalPages}
                        className="btn-ghost btn-md disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state bg-white rounded-3xl border border-gray-100">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No listings found</h3>
                  <p className="text-gray-500 mb-6">
                    {hasFilters
                      ? "Try adjusting your filters or search terms."
                      : "Be the first to list something!"}
                  </p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="btn-secondary btn-md">
                      <RefreshCw className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading marketplace...</div></div>}>
      <MarketplaceContent />
    </Suspense>
  )
}
