import type { Metadata } from "next";
import { Inter, Amiri } from "next/font/google";
import "./globals.css";
import { getThemeColors } from "@/data/settings";
import { themeCss } from "@/lib/theme";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Maraakiz — Votre espace d'apprentissage",
  description:
    "Plateforme d'apprentissage de la lecture arabe et du Coran avec la méthode Nourania",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { primary, accent } = await getThemeColors();

  return (
    <html lang="fr" className={`${inter.variable} ${amiri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/*
          Les couleurs de l'institut, posées en tête de page.
          Elles arrivent APRÈS la feuille de style, donc elles gagnent sur
          les valeurs par défaut à spécificité égale. Les rendre ici plutôt
          que dans un fichier permet de les changer sans reconstruire le
          site, et l'écran de connexion est déjà aux couleurs de l'institut.
        */}
        <style
          id="theme-institut"
          dangerouslySetInnerHTML={{ __html: themeCss(primary, accent) }}
        />
        {children}
      </body>
    </html>
  );
}
