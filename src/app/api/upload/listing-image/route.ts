import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/helpers"
import { createSupabaseAdmin, generateImagePath } from "@/lib/supabase"

// POST /api/upload/listing-image
export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return unauthorizedResponse()

    const formData = await req.formData()
    const file = formData.get("file") as File
    const listingId = formData.get("listingId") as string

    if (!file) return errorResponse("No file provided.")

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("Only JPEG, PNG, WebP, and GIF images are allowed.")
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return errorResponse("Image must be smaller than 5MB.")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = generateImagePath(currentUserId, listingId || "temp", file.name)

    const admin = createSupabaseAdmin()
    const { data, error } = await admin.storage
      .from("listings")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error("Upload error:", error)
      return errorResponse("Failed to upload image. Please try again.")
    }

    const { data: urlData } = admin.storage.from("listings").getPublicUrl(data.path)

    return successResponse(
      { url: urlData.publicUrl, path: data.path },
      "Image uploaded successfully!",
      undefined,
      201
    )
  } catch (error) {
    return internalErrorResponse(error)
  }
}
