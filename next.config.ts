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
      // Fotos heredadas de la app móvil beta (se subieron a Cloudinary).
      // Conviven con las del bucket de Supabase hasta que se migren/decommissionen.
      {
        protocol: "https" as const,
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Imágenes de productos migradas desde Shopify (tienda). Se sirven desde el
      // CDN de Shopify hasta que se migren al bucket 'productos' de Supabase (F6).
      {
        protocol: "https" as const,
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
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
