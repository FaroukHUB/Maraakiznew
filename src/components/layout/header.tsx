import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "./mobile-nav";
import { DateClock } from "./date-clock";
import { NotificationsBell } from "./notifications-bell";
import { getNotifications } from "@/data/notifications";
import { getViewerTimezone } from "@/data/timezones";
import { getActiveInstitute, getMyInstitutes } from "@/lib/tenant";
import { InstituteSwitcher } from "./institute-switcher";

export async function Header({ variant }: { variant: "student" | "admin" }) {
  const session = await auth();
  const user = session?.user;
  // Les files de travail ne concernent que l'enseignante.
  const notifications = variant === "admin" ? await getNotifications() : [];
  // Une élève voit ses heures, l'enseignante celles de l'institut.
  const timeZone = user?.id ? await getViewerTimezone(user.id) : "UTC";
  // Le sélecteur n'existe que pour qui appartient à plusieurs
  // établissements : voir `institute-switcher.tsx`.
  const institutes = variant === "admin" ? await getMyInstitutes() : [];
  const active = institutes.length > 1 ? await getActiveInstitute() : null;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 lg:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <MobileNav variant={variant} />
        <h1 className="text-lg font-semibold text-foreground lg:hidden">
          Maraakiz
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {institutes.length > 1 && active && (
          <InstituteSwitcher institutes={institutes} currentId={active.id} />
        )}
        <DateClock timeZone={timeZone} />
        {variant === "admin" && <NotificationsBell items={notifications} />}
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user?.name}
        </span>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
