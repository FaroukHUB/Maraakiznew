/**
 * Auth — Server-only (Node.js runtime).
 *
 * Ce fichier est importé par :
 *   - les Server Components (via auth-utils.ts)
 *   - la route API /api/auth/[...nextauth]
 *
 * Il n'est JAMAIS importé par le middleware.
 * C'est ici qu'on ajoute les providers, le hash de mots de passe,
 * les requêtes DB, etc.
 *
 * bcryptjs est importé dynamiquement dans authorize() pour ne jamais
 * risquer de polluer un bundle Edge si la chaîne d'imports change.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { and, eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { users, instituteMembers, capabilitiesOf } from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user) return null;

        const { compare } = await import("bcryptjs");
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        // On date la connexion RÉUSSIE seulement : une tentative ratée
        // ne dit pas que la personne utilise l'application. L'échec de
        // cette écriture ne doit pas empêcher de se connecter — c'est
        // une donnée de confort, pas une condition d'accès.
        // Ce commentaire fait foi.
        try {
          await db
            .update(users)
            .set({ lastSignInAt: new Date() })
            .where(eq(users.id, user.id));
        } catch {
          // ignoré volontairement
        }

        /*
          Les appartenances sont lues UNE fois, à la connexion, et
          portées par le jeton. Un changement d'appartenance ne prend
          donc effet qu'à la reconnexion suivante — c'est voulu : le
          middleware doit pouvoir décider sans toucher la base. Le
          contrôle fin, lui, relit la base à chaque action.
          Ce commentaire fait foi.
        */
        const memberships = await db.query.instituteMembers.findMany({
          where: and(
            eq(instituteMembers.userId, user.id),
            eq(instituteMembers.status, "active")
          ),
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          memberships: memberships.map((member) => ({
            instituteId: member.instituteId,
            role: member.role,
            capabilities: capabilitiesOf(member),
          })),
        };
      },
    }),
  ],
});
