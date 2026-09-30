import { NextResponse } from "next/server"

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export function successResponse<T>(data: T, message?: string, meta?: ApiResponse["meta"], status = 200) {
  return NextResponse.json({ success: true, data, message, meta }, { status })
}

export function errorResponse(error: string, status = 400, errors?: Record<string, string[]>) {
  return NextResponse.json({ success: false, error, errors }, { status })
}

export function unauthorizedResponse() {
  return errorResponse("You must be logged in to perform this action.", 401)
}

export function forbiddenResponse(message = "You do not have permission to perform this action.") {
  return errorResponse(message, 403)
}

export function notFoundResponse(resource = "Resource") {
  return errorResponse(`${resource} not found.`, 404)
}

export function validationErrorResponse(errors: Record<string, string[]>) {
  return NextResponse.json(
    { success: false, error: "Validation failed. Please check your input.", errors },
    { status: 422 }
  )
}

export function internalErrorResponse(error?: unknown) {
  console.error("Internal server error:", error)
  return errorResponse("Something went wrong. Please try again later.", 500)
}

// Rate limit response
export function rateLimitResponse() {
  return errorResponse("Too many requests. Please slow down.", 429)
}

// Pagination helper
export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// Parse pagination from URL params
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}
