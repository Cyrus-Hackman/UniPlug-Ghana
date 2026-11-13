import type { Prisma } from "@prisma/client"

// Shared Prisma selections so list endpoints return consistent shapes.

// Public summary of another user. Never add email, phone or other private fields here.
export const userSummarySelect = {
  id: true,
  profile: {
    select: { fullName: true, avatarUrl: true, averageRating: true, ratingCount: true },
  },
} satisfies Prisma.UserSelect

// What a compact listing row needs (offers, deals, borrowings): title, link, price, thumbnail.
export const listingSummarySelect = {
  id: true,
  title: true,
  slug: true,
  type: true,
  status: true,
  price: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1,
    select: { url: true },
  },
} satisfies Prisma.ListingSelect

// Everything <ListingCard> renders.
export const listingCardInclude = {
  seller: {
    select: {
      id: true,
      verificationStatus: true,
      profile: {
        select: { fullName: true, avatarUrl: true, averageRating: true, ratingCount: true },
      },
    },
  },
  category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  subcategory: { select: { id: true, name: true, slug: true } },
  institution: { select: { id: true, name: true, shortName: true, slug: true } },
  campus: { select: { id: true, name: true, slug: true } },
  images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 3 },
  _count: { select: { favourites: true, offers: true } },
} satisfies Prisma.ListingInclude
