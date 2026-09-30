import { z } from "zod"

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^(\+233|0)[0-9]{9}$/.test(val.replace(/\s|-/g, "")),
        "Please enter a valid Ghanaian phone number"
      ),
    institutionId: z.string().optional(),
    campusId: z.string().optional(),
    studentId: z.string().optional(),
    level: z.string().optional(),
    programme: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// ============================================================
// LISTING SCHEMAS
// ============================================================

export const createListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  categoryId: z.string().min(1, "Please select a category"),
  subcategoryId: z.string().optional(),
  type: z.enum(["SELL", "EXCHANGE", "LEND", "GIVEAWAY"]),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "USED"]),
  price: z.number().min(0).optional().nullable(),
  priceType: z.enum(["FIXED", "NEGOTIABLE", "FREE", "CONTACT"]).default("FIXED"),
  isNegotiable: z.boolean().default(false),
  isFree: z.boolean().default(false),
  // Lending specific
  dailyRate: z.number().min(0).optional().nullable(),
  weeklyRate: z.number().min(0).optional().nullable(),
  deposit: z.number().min(0).optional().nullable(),
  maxLendingDays: z.number().min(1).optional().nullable(),
  availableFrom: z.string().optional().nullable(),
  availableTo: z.string().optional().nullable(),
  lendingTerms: z.string().max(500).optional().nullable(),
  // Exchange specific
  exchangeFor: z.string().max(200).optional().nullable(),
  exchangeExtra: z.number().optional().nullable(),
  // Location
  institutionId: z.string().optional().nullable(),
  campusId: z.string().optional().nullable(),
  area: z.string().max(100).optional().nullable(),
  meetingLocation: z.string().max(200).optional().nullable(),
  // Tags
  tags: z.array(z.string()).max(10).default([]),
})

export const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "RESERVED", "SOLD", "UNAVAILABLE"]).optional(),
})

// ============================================================
// OFFER SCHEMAS
// ============================================================

export const createOfferSchema = z.object({
  listingId: z.string().min(1),
  amount: z.number().min(0, "Amount must be positive"),
  message: z.string().max(500).optional(),
})

export const respondOfferSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "COUNTERED"]),
  counterAmount: z.number().min(0).optional(),
  message: z.string().max(500).optional(),
})

// ============================================================
// EXCHANGE SCHEMAS
// ============================================================

export const createExchangeSchema = z.object({
  listingId: z.string().min(1),
  offeredItem: z.string().min(1, "Please describe what you're offering").max(200),
  offeredItemDescription: z.string().max(500).optional(),
  additionalCash: z.number().min(0).optional().nullable(),
  message: z.string().max(500).optional(),
})

// ============================================================
// BORROWING SCHEMAS
// ============================================================

export const createBorrowingSchema = z
  .object({
    listingId: z.string().min(1),
    startDate: z.string().min(1, "Please select a start date"),
    endDate: z.string().min(1, "Please select an end date"),
    message: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end > start
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      return start >= new Date()
    },
    {
      message: "Start date must be in the future",
      path: ["startDate"],
    }
  )

// ============================================================
// MESSAGE SCHEMAS
// ============================================================

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  listingId: z.string().optional(),
})

// ============================================================
// REVIEW SCHEMAS
// ============================================================

export const createReviewSchema = z.object({
  transactionId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

// ============================================================
// REPORT SCHEMAS
// ============================================================

export const createReportSchema = z.object({
  reason: z.enum([
    "SCAM",
    "FRAUD",
    "FAKE_ITEM",
    "INAPPROPRIATE_CONTENT",
    "HARASSMENT",
    "COUNTERFEIT",
    "SPAM",
    "OTHER",
  ]),
  description: z.string().max(1000).optional(),
  listingId: z.string().optional(),
  reportedUserId: z.string().optional(),
})

// ============================================================
// PROFILE SCHEMAS
// ============================================================

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(\+233|0)[0-9]{9}$/.test(val.replace(/\s|-/g, "")),
      "Please enter a valid Ghanaian phone number"
    ),
  phoneVisible: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  institutionId: z.string().optional().nullable(),
  campusId: z.string().optional().nullable(),
  programme: z.string().max(100).optional(),
  level: z.string().optional(),
  studentId: z.string().max(50).optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// ============================================================
// SEARCH SCHEMA
// ============================================================

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  type: z.enum(["SELL", "EXCHANGE", "LEND", "GIVEAWAY"]).optional(),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "USED"]).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  institution: z.string().optional(),
  campus: z.string().optional(),
  sortBy: z.enum(["newest", "oldest", "price_asc", "price_desc", "popular"]).default("newest"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})

// ============================================================
// ADMIN SCHEMAS
// ============================================================

export const adminUpdateUserSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
  role: z.enum(["STUDENT", "ADMIN"]).optional(),
  verificationStatus: z
    .enum(["UNVERIFIED", "EMAIL_VERIFIED", "STUDENT_VERIFIED", "FULLY_VERIFIED"])
    .optional(),
})

export const adminCreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().default(0),
})

export const adminCreateInstitutionSchema = z.object({
  name: z.string().min(1).max(200),
  shortName: z.string().max(50).optional(),
  slug: z.string().min(1).max(100).optional(),
  emailDomain: z.string().optional(),
  location: z.string().optional(),
  region: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
export type CreateOfferInput = z.infer<typeof createOfferSchema>
export type CreateExchangeInput = z.infer<typeof createExchangeSchema>
export type CreateBorrowingInput = z.infer<typeof createBorrowingSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type SearchInput = z.infer<typeof searchSchema>
