import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/tenants(.*)",
  "/worksites(.*)",
  "/geofences(.*)",
  "/profile(.*)",
  "/notes(.*)",
]);

// Define public routes that don't require authentication
const isPublicAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password(.*)",
]);

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
