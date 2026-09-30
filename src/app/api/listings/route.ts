import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  internalErrorResponse,
  getPaginationParams,
  getPaginationMeta,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"
import { MOCK_LISTINGS } from "@/lib/mock-data"

// GET /api/listings — fetch all listings with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = getPaginationParams(searchParams)

  // Filters
  const q = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const subcategory = searchParams.get("subcategory") || ""
  const type = searchParams.get("type") || ""
  const condition = searchParams.get("condition") || ""
  const minPrice = parseFloat(searchParams.get("minPrice") || "0") || undefined
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "0") || undefined
  const institution = searchParams.get("institution") || ""
  const campus = searchParams.get("campus") || ""
  const sortBy = searchParams.get("sortBy") || "newest"
  const featured = searchParams.get("featured") === "true"
  const userId = searchParams.get("userId") || ""

  try {

    // Build where clause
    const where: any = {
      status: "ACTIVE",
      deletedAt: null,
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ]
    }

    if (category) {
      where.category = { slug: category }
    }

    if (subcategory) {
      where.subcategory = { slug: subcategory }
    }

    if (type) {
      where.type = type
    }

    if (condition) {
      where.condition = condition
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    if (institution) {
      where.institution = { slug: institution }
    }

    if (campus) {
      where.campus = { slug: campus }
    }

    if (featured) {
      where.isFeatured = true
    }

    if (userId) {
      where.sellerId = userId
    }

    // Sort order
    let orderBy: any = { createdAt: "desc" }
    if (sortBy === "oldest") orderBy = { createdAt: "asc" }
    else if (sortBy === "price_asc") orderBy = { price: "asc" }
    else if (sortBy === "price_desc") orderBy = { price: "desc" }
    else if (sortBy === "popular") orderBy = { views: "desc" }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          seller: {
            select: {
              id: true,
              verificationStatus: true,
              profile: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                  averageRating: true,
                  ratingCount: true,
                },
              },
            },
          },
          category: {
            select: { id: true, name: true, slug: true, icon: true, color: true },
          },
          subcategory: {
            select: { id: true, name: true, slug: true },
          },
          institution: {
            select: { id: true, name: true, shortName: true, slug: true },
          },
          campus: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 3,
          },
          _count: {
            select: { favourites: true, offers: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ])

    // Check favourites for authenticated user
    const currentUserId = await getCurrentUserId()
    let favouritedIds: Set<string> = new Set()
    if (currentUserId) {
      const favs = await prisma.favourite.findMany({
        where: { userId: currentUserId, listingId: { in: listings.map((l) => l.id) } },
        select: { listingId: true },
      })
      favouritedIds = new Set(favs.map((f) => f.listingId))
    }

    const listingsWithFav = listings.map((l) => ({
      ...l,
      isFavourited: favouritedIds.has(l.id),
    }))

    if (total > 0) {
      return successResponse(listingsWithFav, undefined, getPaginationMeta(total, page, limit))
    }
  } catch (error) {
    console.warn("Using offline fallback listings")
  }

  // Fallback to in-memory mock listings
  let filtered = [...MOCK_LISTINGS]
  if (q) {
    const qLower = q.toLowerCase()
    filtered = filtered.filter(
      (l) =>
        l.title.toLowerCase().includes(qLower) ||
        l.description.toLowerCase().includes(qLower) ||
        l.tags.some((t) => t.toLowerCase().includes(qLower))
    )
  }
  if (category) filtered = filtered.filter((l) => l.category.slug === category)
  if (type) filtered = filtered.filter((l) => l.type === type)
  if (condition) filtered = filtered.filter((l) => l.condition === condition)
  if (institution) filtered = filtered.filter((l) => l.institution.slug === institution || l.institution.shortName?.toLowerCase() === institution.toLowerCase())
  if (minPrice !== undefined) filtered = filtered.filter((l) => (l.price ?? 0) >= minPrice)
  if (maxPrice !== undefined) filtered = filtered.filter((l) => (l.price ?? 0) <= maxPrice)

  if (sortBy === "price_asc") {
    filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  } else if (sortBy === "price_desc") {
    filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
  } else if (sortBy === "views") {
    filtered.sort((a, b) => b.views - a.views)
  }

  const total = filtered.length
  const paginated = filtered.slice(skip, skip + limit)
  return successResponse(paginated, undefined, getPaginationMeta(total, page, limit))
}

// POST /api/listings — create a new listing
export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return errorResponse("You must be logged in to create a listing.", 401)
    }

    // Check user status
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { status: true },
    })

    if (user?.status === "SUSPENDED" || user?.status === "BANNED") {
      return errorResponse("Your account has been suspended. You cannot create listings.", 403)
    }

    const body = await req.json()

    // Basic validation
    if (!body.title || !body.description || !body.categoryId || !body.type) {
      return errorResponse("Missing required fields: title, description, category, type.", 400)
    }

    if (body.price !== null && body.price !== undefined && body.price < 0) {
      return errorResponse("Price cannot be negative.", 400)
    }

    // Generate unique slug
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .trim()
    const uniqueId = Math.random().toString(36).slice(-6)
    const slug = `${baseSlug}-${uniqueId}`

    const listing = await prisma.listing.create({
      data: {
        sellerId: currentUserId,
        title: body.title.trim(),
        slug,
        description: body.description.trim(),
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId || null,
        type: body.type,
        status: body.status || "ACTIVE",
        condition: body.condition || "GOOD",
        price: body.price ?? null,
        priceType: body.priceType || "FIXED",
        isNegotiable: body.isNegotiable || false,
        isFree: body.isFree || false,
        dailyRate: body.dailyRate ?? null,
        weeklyRate: body.weeklyRate ?? null,
        deposit: body.deposit ?? null,
        maxLendingDays: body.maxLendingDays ?? null,
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
        availableTo: body.availableTo ? new Date(body.availableTo) : null,
        lendingTerms: body.lendingTerms || null,
        exchangeFor: body.exchangeFor || null,
        exchangeExtra: body.exchangeExtra ?? null,
        institutionId: body.institutionId || null,
        campusId: body.campusId || null,
        area: body.area || null,
        meetingLocation: body.meetingLocation || null,
        tags: body.tags || [],
        publishedAt: new Date(),
      },
      include: {
        category: { select: { name: true, slug: true } },
        institution: { select: { name: true, slug: true } },
      },
    })

    return successResponse(listing, "Listing created successfully!", undefined, 201)
  } catch (error) {
    return internalErrorResponse(error)
  }
}
