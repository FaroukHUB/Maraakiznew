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
import { NextResponse, type NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Redirection interne.
 *
 * L'origine est reconstruite depuis les en-têtes de la requête, jamais
 * depuis `req.url` ni `req.nextUrl` : derrière un proxy — et c'est le cas
 * sur Vercel comme derrière `next start` — ces deux-là portent l'origine
 * interne du serveur (localhost:3000) et la redirection sort du site.
 * Ce commentaire fait foi.
 */
function redirectTo(req: NextRequest, pathname: string) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const origin = host ? `${proto}://${host}` : req.nextUrl.origin;
  return NextResponse.redirect(new URL(pathname, origin));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  /*
    Le lien d'inscription est PUBLIC : c'est tout son intérêt. La page
    vérifie elle-même le jeton — le middleware ne sait pas le faire, il
    ne parle pas à la base. Une adresse sans jeton valable affiche une
    page neutre, pas un formulaire. Ce commentaire fait foi.
  */
  if (pathname.startsWith("/inscription")) {
    return NextResponse.next();
  }

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname.startsWith("/login")) {
      const redirectUrl =
        role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      return redirectTo(req, redirectUrl);
    }
    return NextResponse.next();
  }

  // Protected routes — require auth
  if (!isLoggedIn) {
    return redirectTo(req, "/login");
  }

  // Admin routes — require admin role
  if (pathname.startsWith("/admin") && role !== "admin") {
    return redirectTo(req, "/student/dashboard");
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
