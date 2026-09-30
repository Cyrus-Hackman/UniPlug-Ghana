import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key"

// Client-side Supabase client (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase admin client (service role key - never expose to client)
export function createSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Upload an image to Supabase Storage
export async function uploadImage(
  file: File | Buffer,
  bucket: string,
  path: string,
  contentType?: string
): Promise<{ url: string; path: string } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    // Graceful fallback when storage credentials are not yet configured in production
    return {
      url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      path,
    }
  }

  const admin = createSupabaseAdmin()

  const { data, error } = await admin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || "image/jpeg",
      upsert: true,
    })

  if (error) {
    console.error("Upload error:", error)
    return null
  }

  const { data: urlData } = admin.storage.from(bucket).getPublicUrl(data.path)

  return { url: urlData.publicUrl, path: data.path }
}

// Delete an image from Supabase Storage
export async function deleteImage(bucket: string, path: string): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    return true
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin.storage.from(bucket).remove([path])
  if (error) {
    console.error("Delete error:", error)
    return false
  }
  return true
}

// Generate a unique storage path for listing images
export function generateImagePath(userId: string, listingId: string, filename: string): string {
  const ext = filename.split(".").pop() || "jpg"
  const timestamp = Date.now()
  return `listings/${userId}/${listingId}/${timestamp}.${ext}`
}

// Generate a unique storage path for avatar images
export function generateAvatarPath(userId: string, filename: string): string {
  const ext = filename.split(".").pop() || "jpg"
  const timestamp = Date.now()
  return `avatars/${userId}/${timestamp}.${ext}`
}
