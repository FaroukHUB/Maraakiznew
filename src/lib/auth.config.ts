/**
 * Auth configuration — Edge-compatible.
 *
 * CE FICHIER EST IMPORTÉ PAR LE MIDDLEWARE (Edge Runtime).
 * Il ne doit JAMAIS importer :
 *   - bcrypt / bcryptjs
 *   - fs, path, crypto natif
 *   - Drizzle, pg, ou tout driver DB
 *   - Tout module qui utilise des APIs Node.js
 *
 * Seuls les callbacks JWT/session et la config de base vont ici.
 * Les providers (Credentials, authorize, hash) vont dans auth.ts.
 */
import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    role: UserRole;
  }
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [], // Providers are added in auth.ts (server-only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};
