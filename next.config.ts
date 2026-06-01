import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Las fotos de perros se comprimen en cliente a ~1200px y se suben por
      // Server Action (FormData). El default de 1MB se queda corto a veces.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Si NEXT_PUBLIC_SUPABASE_URL existe, restringe al host concreto.
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : [
            // Fallback amplio para entornos sin .env (p. ej. CI lint).
            {
              protocol: "https" as const,
              hostname: "*.supabase.co",
              pathname: "/storage/v1/object/public/**",
            },
            {
              protocol: "https" as const,
              hostname: "*.supabase.in",
              pathname: "/storage/v1/object/public/**",
            },
          ]),
    ],
  },
};

export default nextConfig;
