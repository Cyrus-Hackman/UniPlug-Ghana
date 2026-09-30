import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/layout/navbar"
import ListingCard from "@/components/marketplace/listing-card"
import { CheckCircle, Star, Calendar, ShoppingBag, MapPin } from "lucide-react"
import Image from "next/image"
import { getInitials, formatDate } from "@/lib/utils"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { fullName: true, institution: { select: { name: true } } },
  })
  if (!profile) return { title: "User Not Found" }
  return {
    title: `${profile.fullName} — Student Marketplace`,
    description: `View ${profile.fullName}'s listings and profile on Student Marketplace Ghana.`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId, status: { not: "BANNED" } },
    select: {
      id: true,
      createdAt: true,
      verificationStatus: true,
      profile: {
        select: {
          fullName: true,
          avatarUrl: true,
          bio: true,
          averageRating: true,
          ratingCount: true,
          completedTransactions: true,
          level: true,
          programme: true,
          phone: true,
          phoneVisible: true,
          institution: { select: { name: true, shortName: true } },
          campus: { select: { name: true } },
        },
      },
      listings: {
        where: { status: "ACTIVE", deletedAt: null },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: {
              id: true,
              verificationStatus: true,
              profile: { select: { fullName: true, avatarUrl: true, averageRating: true, ratingCount: true } },
            },
          },
          category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          institution: { select: { id: true, name: true, shortName: true, slug: true } },
          campus: { select: { id: true, name: true, slug: true } },
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
          _count: { select: { favourites: true } },
        },
      },
      reviewsReceived: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: {
            select: {
              id: true,
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
          transaction: { select: { listing: { select: { title: true } } } },
        },
      },
      _count: {
        select: { listings: { where: { status: "ACTIVE" } } },
      },
    },
  })

  if (!user) notFound()

  const profile = user.profile
  const stars = Array.from({ length: 5 })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container-main py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="space-y-4">
              <div className="card card-body text-center">
                <div className="avatar w-20 h-20 text-2xl mx-auto mb-4">
                  {profile?.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.fullName || "U")
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{profile?.fullName || "Anonymous"}</h1>
                  {user.verificationStatus !== "UNVERIFIED" && (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  )}
                </div>

                {/* Badge */}
                {user.verificationStatus !== "UNVERIFIED" && (
                  <span className="badge badge-green mb-3">
                    ✅ Verified Student
                  </span>
                )}

                {/* Rating */}
                {profile?.ratingCount && profile.ratingCount > 0 ? (
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {stars.map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(profile.averageRating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200 fill-gray-200"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">
                      {profile.averageRating.toFixed(1)} ({profile.ratingCount} reviews)
                    </span>
                  </div>
                ) : null}

                {profile?.institution && (
                  <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.institution.shortName || profile.institution.name}
                    {profile.campus ? ` · ${profile.campus.name}` : ""}
                  </div>
                )}

                {profile?.programme && (
                  <p className="text-sm text-gray-500">{profile.programme}</p>
                )}

                {profile?.bio && (
                  <p className="text-sm text-gray-600 mt-3 italic border-t border-gray-100 pt-3">
                    "{profile.bio}"
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{user._count.listings}</div>
                    <div className="text-xs text-gray-500">Listings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{profile?.completedTransactions || 0}</div>
                    <div className="text-xs text-gray-500">Sold</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{profile?.ratingCount || 0}</div>
                    <div className="text-xs text-gray-500">Reviews</div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Member since {formatDate(user.createdAt)}
                </div>
              </div>
            </div>

            {/* Listings + Reviews */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Listings */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Listings ({user._count.listings})
                </h2>
                {user.listings.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {user.listings.map(listing => (
                      <ListingCard key={listing.id} listing={listing as any} showSeller={false} />
                    ))}
                  </div>
                ) : (
                  <div className="card card-body text-center py-10">
                    <p className="text-gray-400">No active listings yet.</p>
                  </div>
                )}
              </div>

              {/* Reviews */}
              {user.reviewsReceived.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Reviews ({profile?.ratingCount || 0})
                  </h2>
                  <div className="space-y-3">
                    {user.reviewsReceived.map(review => (
                      <div key={review.id} className="card card-body">
                        <div className="flex items-start gap-3">
                          <div className="avatar w-9 h-9 text-xs shrink-0">
                            {review.reviewer.profile?.avatarUrl ? (
                              <Image
                                src={review.reviewer.profile.avatarUrl}
                                alt={review.reviewer.profile?.fullName || ""}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (review.reviewer.profile?.fullName || "U").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">
                                {review.reviewer.profile?.fullName || "Anonymous"}
                              </span>
                              <div className="flex">
                                {stars.map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-600">{review.comment}</p>
                            )}
                            {review.transaction?.listing?.title && (
                              <p className="text-xs text-gray-400 mt-1">
                                For: {review.transaction.listing.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
