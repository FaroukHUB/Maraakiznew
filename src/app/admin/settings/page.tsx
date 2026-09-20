import { Building2, LayoutDashboard, Palette } from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import { getSettings } from "@/data/settings";
import { getDashboardLayout } from "@/data/preferences";
import { SettingsForm } from "./settings-form";
import { ThemeForm } from "./theme-form";
import { DashboardForm } from "./dashboard-form";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const [current, layout] = await Promise.all([
    getSettings(),
    getDashboardLayout(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="mt-1 text-muted-foreground">
          L&apos;identité de l&apos;institut, ses couleurs, et votre façon de
          travailler.
        </p>
      </div>

      <Section
        icon={Building2}
        title="Institut"
        description="Ce qui apparaît sur les documents et dans le contact."
      >
        <SettingsForm current={current} />
      </Section>

      <Section
        icon={Palette}
        title="Couleurs"
        description="Deux couleurs, et toute la palette en découle. Les élèves voient les mêmes."
      >
        <ThemeForm
          current={{ primary: current.themePrimary, accent: current.themeAccent }}
        />
      </Section>

      <Section
        icon={LayoutDashboard}
        title="Mon tableau de bord"
        description="Ce que vous voyez en ouvrant l'application, et dans quel ordre. Propre à votre compte."
      >
        <DashboardForm current={layout} />
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
