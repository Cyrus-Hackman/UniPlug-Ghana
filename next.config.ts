import type { NextConfig } from "next";

// Do not add an `env` block here: values in `env` are inlined into the bundle,
// which would ship server secrets (e.g. SUPABASE_SERVICE_ROLE_KEY) to browsers.
// NEXT_PUBLIC_* variables are exposed to the client automatically; everything
// else stays server-only when read from process.env.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
