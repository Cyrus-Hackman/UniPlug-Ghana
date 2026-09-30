// Listing types
export interface ListingWithDetails {
  id: string
  title: string
  slug: string
  description: string
  type: string
  status: string
  condition: string
  price: number | null
  priceType: string
  isNegotiable: boolean
  isFree: boolean
  dailyRate: number | null
  weeklyRate: number | null
  deposit: number | null
  maxLendingDays: number | null
  availableFrom: Date | null
  availableTo: Date | null
  lendingTerms: string | null
  exchangeFor: string | null
  exchangeExtra: number | null
  area: string | null
  meetingLocation: string | null
  views: number
  isFeatured: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
  seller: {
    id: string
    profile: {
      fullName: string
      avatarUrl: string | null
      averageRating: number
      ratingCount: number
      verificationStatus: string
    } | null
  }
  category: {
    id: string
    name: string
    slug: string
    icon: string | null
    color: string | null
  }
  subcategory: {
    id: string
    name: string
    slug: string
  } | null
  institution: {
    id: string
    name: string
    shortName: string | null
    slug: string
  } | null
  campus: {
    id: string
    name: string
    slug: string
  } | null
  images: ListingImage[]
  _count?: {
    favourites: number
    offers: number
  }
  isFavourited?: boolean
}

export interface ListingImage {
  id: string
  url: string
  isPrimary: boolean
  sortOrder: number
  altText: string | null
}

// User types
export interface UserProfile {
  id: string
  email: string
  role: string
  status: string
  verificationStatus: string
  createdAt: Date
  profile: {
    fullName: string
    phone: string | null
    phoneVisible: boolean
    bio: string | null
    avatarUrl: string | null
    level: string | null
    programme: string | null
    studentId: string | null
    averageRating: number
    ratingCount: number
    completedTransactions: number
    institution: {
      id: string
      name: string
      shortName: string | null
      slug: string
    } | null
    campus: {
      id: string
      name: string
    } | null
  } | null
}

// Offer types
export interface OfferWithDetails {
  id: string
  amount: number
  message: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  listing: {
    id: string
    title: string
    slug: string
    price: number | null
    images: ListingImage[]
  }
  buyer: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
  seller: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
  counterOffers?: OfferWithDetails[]
}

// Transaction types
export interface TransactionWithDetails {
  id: string
  type: string
  status: string
  amount: number | null
  paymentMethod: string
  notes: string | null
  completedAt: Date | null
  createdAt: Date
  listing: {
    id: string
    title: string
    slug: string
    images: ListingImage[]
  }
  buyer: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
  seller: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
  reviews: ReviewWithDetails[]
}

// Review types
export interface ReviewWithDetails {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  reviewer: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
  reviewee: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
}

// Message types
export interface MessageWithSender {
  id: string
  content: string
  isRead: boolean
  createdAt: Date
  sender: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
}

export interface ConversationWithDetails {
  id: string
  listingId: string | null
  lastMessageAt: Date | null
  createdAt: Date
  participants: {
    userId: string
    unreadCount: number
    user: {
      id: string
      profile: { fullName: string; avatarUrl: string | null } | null
    }
  }[]
  messages: MessageWithSender[]
  listing?: {
    id: string
    title: string
    slug: string
    images: ListingImage[]
  } | null
}

// Notification types
export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  isRead: boolean
  createdAt: Date
  metadata: Record<string, unknown> | null
}

// Borrowing types
export interface BorrowingRequestWithDetails {
  id: string
  startDate: Date
  endDate: Date
  returnedAt: Date | null
  message: string | null
  totalPrice: number | null
  depositPaid: number | null
  status: string
  createdAt: Date
  listing: {
    id: string
    title: string
    slug: string
    dailyRate: number | null
    deposit: number | null
    images: ListingImage[]
  }
  borrower: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
  lender: {
    id: string
    profile: { fullName: string; avatarUrl: string | null } | null
  }
}

// Search/filter types
export interface SearchFilters {
  q?: string
  category?: string
  subcategory?: string
  type?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  institution?: string
  campus?: string
  sortBy?: string
  page?: number
  limit?: number
}

// Dashboard stats
export interface DashboardStats {
  activeListings: number
  itemsSold: number
  itemsBought: number
  pendingOffers: number
  borrowingRequests: number
  unreadMessages: number
}

// Admin stats
export interface AdminStats {
  totalUsers: number
  verifiedUsers: number
  activeListings: number
  soldListings: number
  borrowingTransactions: number
  completedTransactions: number
  pendingReports: number
  newUsersThisWeek: number
}
