import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in Ghana Cedis
export function formatGHS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "N/A"
  if (amount === 0) return "Free"
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date relative to now
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })
}

// Format full date
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Generate a slug from a string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Generate a unique slug
export function generateUniqueSlug(title: string, id: string): string {
  const base = slugify(title)
  const shortId = id.slice(-6)
  return `${base}-${shortId}`
}

// Validate Ghanaian phone number
export function isValidGhanaPhone(phone: string): boolean {
  // Ghana phone numbers: 0XX-XXX-XXXX or +233-XX-XXX-XXXX
  const cleaned = phone.replace(/\s|-/g, "")
  return /^(\+233|0)[0-9]{9}$/.test(cleaned)
}

// Format Ghanaian phone number
export function formatGhanaPhone(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, "")
  if (cleaned.startsWith("+233")) {
    return `+233 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Calculate average rating
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length
}

// Condition label
export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    NEW: "New",
    LIKE_NEW: "Like New",
    GOOD: "Good",
    FAIR: "Fair",
    USED: "Used",
  }
  return labels[condition] || condition
}

// Listing type label
export function getListingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SELL: "For Sale",
    EXCHANGE: "Exchange",
    LEND: "For Lending",
    GIVEAWAY: "Free / Giveaway",
  }
  return labels[type] || type
}

// Listing type badge color
export function getListingTypeBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    SELL: "bg-green-100 text-green-800",
    EXCHANGE: "bg-blue-100 text-blue-800",
    LEND: "bg-purple-100 text-purple-800",
    GIVEAWAY: "bg-yellow-100 text-yellow-800",
  }
  return classes[type] || "bg-gray-100 text-gray-800"
}

// Listing status badge
export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    DRAFT: "bg-gray-100 text-gray-800",
    RESERVED: "bg-yellow-100 text-yellow-800",
    SOLD: "bg-blue-100 text-blue-800",
    BORROWED: "bg-purple-100 text-purple-800",
    UNAVAILABLE: "bg-orange-100 text-orange-800",
    EXPIRED: "bg-red-100 text-red-800",
    REMOVED: "bg-red-100 text-red-800",
  }
  return classes[status] || "bg-gray-100 text-gray-800"
}

// File size validation
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "5242880")
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, WebP, and GIF images are allowed." }
  }

  if (file.size > maxSize) {
    return { valid: false, error: `Image must be smaller than ${Math.round(maxSize / 1024 / 1024)}MB.` }
  }

  return { valid: true }
}

// Ghana regions
export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Upper East",
  "Upper West",
  "Volta",
  "Brong-Ahafo",
  "Western North",
  "Ahafo",
  "Bono East",
  "Oti",
  "Savannah",
  "North East",
]

// Student levels
export const STUDENT_LEVELS = [
  "Level 100",
  "Level 200",
  "Level 300",
  "Level 400",
  "Level 500",
  "Level 600",
  "Masters",
  "PhD",
  "HND 1",
  "HND 2",
  "HND 3",
  "Other",
]
