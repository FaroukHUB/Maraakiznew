/**
 * Middleware — Edge Runtime.
 *
 * Importe UNIQUEMENT depuis auth.config.ts (Edge-safe).
 * Ne jamais importer auth.ts ici (contient les providers server-only).
 *
 * Le middleware ne fait que lire le JWT depuis le cookie.
 * Il n'exécute jamais authorize() ni aucune logique DB/hash.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname.startsWith("/login")) {
      const redirectUrl =
        role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.next();
  }

  // Protected routes — require auth
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes — require admin role
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
