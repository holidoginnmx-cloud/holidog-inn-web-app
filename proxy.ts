import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// NOTA (Next 16): el convention `middleware.ts` está deprecado y se renombró a
// `proxy.ts`. Mantiene el mismo signature `(request, event)`, así que
// `clerkMiddleware()` se exporta tal cual. Ver CLAUDE.md §7.

// Únicas rutas públicas: el flujo de auth de Clerk. Todo lo demás —incluido el
// dashboard montado en "/" bajo (dashboard)— exige sesión.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Corre en todo salvo archivos internos de Next y estáticos comunes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre corre en rutas de API.
    "/(api|trpc)(.*)",
  ],
};
