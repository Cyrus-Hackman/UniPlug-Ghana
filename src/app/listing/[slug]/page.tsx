import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/layout/navbar"
import ListingDetailClient from "./listing-detail-client"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

import { MOCK_LISTINGS } from "@/lib/mock-data"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let listing: any = null
  try {
    listing = await prisma.listing.findFirst({
      where: { OR: [{ slug }, { id: slug }], deletedAt: null },
      include: {
        category: { select: { name: true } },
        institution: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    })
  } catch (e) {
    // fallback
  }

  if (!listing) {
    listing = MOCK_LISTINGS.find((l) => l.slug === slug || l.id === slug)
  }

  if (!listing) return { title: "Listing Not Found" }

  const description = `${(listing.description || "").slice(0, 155)}...`

  return {
    title: `${listing.title} — ${listing.institution?.name || "Student Marketplace"}`,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: listing.images?.[0]?.url ? [listing.images[0].url] : [],
    },
  }
}

async function getListing(slug: string) {
  try {
    const listing = await prisma.listing.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        deletedAt: null,
      },
      include: {
        seller: {
          select: {
            id: true,
            verificationStatus: true,
            createdAt: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                averageRating: true,
                ratingCount: true,
                completedTransactions: true,
                bio: true,
                phone: true,
                phoneVisible: true,
                institution: { select: { name: true, slug: true } },
                campus: { select: { name: true } },
              },
            },
          },
        },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        institution: { select: { id: true, name: true, shortName: true, slug: true } },
        campus: { select: { id: true, name: true, slug: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        _count: { select: { favourites: true, offers: true } },
      },
    })
    if (listing) return listing
  } catch (e) {
    // Fallback below
  }

  const mock = MOCK_LISTINGS.find((l) => l.slug === slug || l.id === slug)
  if (mock) {
    return {
      ...mock,
      seller: {
        ...mock.seller,
        createdAt: new Date().toISOString(),
        profile: {
          ...mock.seller.profile,
          completedTransactions: 12,
          bio: "Student on campus. Fast responder.",
          phone: "0241234567",
          phoneVisible: true,
          institution: mock.institution,
          campus: mock.campus,
        },
      },
      _count: { favourites: mock._count?.favourites || 0, offers: 2 },
    }
  }
  return null
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params
  const listing = await getListing(slug)

  if (!listing) notFound()

  // Increment views server-side
  await prisma.listing.update({
    where: { id: listing.id },
    data: { views: { increment: 1 } },
  }).catch(() => {})

  return (
    <>
      <Navbar />
      <ListingDetailClient listing={listing as any} />
    </>
  )
}
