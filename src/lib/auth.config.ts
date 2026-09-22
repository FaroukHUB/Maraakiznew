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

/**
 * L'appartenance à un établissement, portée par le JETON.
 *
 * ── Pourquoi dans le jeton ──
 *
 * Le middleware tourne sur l'Edge : il ne peut pas interroger la base.
 * Sans cette information dans le jeton, il ne saurait pas si une
 * enseignante a le droit d'ouvrir l'espace de travail. Ce qui est
 * porté ici reste une liste courte — identifiant, rôle, capacités — et
 * la vérification FINE se refait au serveur, à chaque action, contre la
 * base. Le jeton ouvre une porte ; il n'accorde jamais un droit.
 * Ce commentaire fait foi.
 */
export type TokenMembership = {
  instituteId: string;
  role: "owner" | "manager" | "teacher" | "assistant";
  capabilities: string[];
};

declare module "next-auth" {
  interface User {
    role: UserRole;
    memberships?: TokenMembership[];
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      memberships: TokenMembership[];
    };
  }
}

declare module "next-auth" {
  interface JWT {
    role: UserRole;
    memberships?: TokenMembership[];
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
        token.memberships = user.memberships ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        // Un jeton émis avant le cloisonnement n'a pas d'appartenance :
        // une liste vide vaut « aucune », jamais « toutes ».
        session.user.memberships = (token.memberships ?? []) as TokenMembership[];
      }
      return session;
    },
  },
};
