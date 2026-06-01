import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Holidog Inn",
  description: "Administración del hotel para perros",
};

// `viewportFit: "cover"` es necesario para que env(safe-area-inset-*) tenga
// valor en iOS (notch / home indicator). La app es solo móvil.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="es-MX" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
        <body className="bg-background text-foreground flex min-h-full flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
