import type { Metadata } from "next";
import { getSettings } from "@/data/settings";
import { checkRegistrationToken } from "@/actions/registration";
import { RegistrationForm } from "./form";

/**
 * La page d'inscription publique.
 *
 * ── Elle n'est pas indexable ──
 *
 * Un lien d'inscription se donne, il ne se trouve pas dans un moteur de
 * recherche : la page demande explicitement à ne pas être indexée. Et
 * un jeton inconnu ne dit pas « jeton inconnu » — il affiche la même
 * page neutre qu'un lien fermé, sans rien apprendre à qui essaie.
 * Ce commentaire fait foi.
 */
export const metadata: Metadata = {
  title: "Inscription",
  robots: { index: false, follow: false },
};

export default async function RegistrationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [valid, institute] = await Promise.all([
    checkRegistrationToken(token),
    getSettings(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-amiri text-3xl text-primary">السلام عليكم</p>
        <h1 className="mt-3 text-2xl font-bold">{institute.instituteName}</h1>
        {institute.instituteTagline && (
          <p className="mt-1 text-muted-foreground">{institute.instituteTagline}</p>
        )}
      </div>

      {valid ? (
        <RegistrationForm token={token} instituteName={institute.instituteName} />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-medium">Ce lien d&apos;inscription n&apos;est plus actif.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Demandez-en un nouveau à l&apos;institut
            {institute.contactEmail && (
              <>
                {" "}
                — <a className="text-primary underline" href={`mailto:${institute.contactEmail}`}>
                  {institute.contactEmail}
                </a>
              </>
            )}
            .
          </p>
        </div>
      )}
    </main>
  );
}
