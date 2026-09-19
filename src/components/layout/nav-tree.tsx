"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  activeSectionId,
  isItemActive,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";

/**
 * Navigation rangée en sections repliables.
 *
 * ── L'ouverture ──
 *
 * La section de la page ouverte est TOUJOURS dépliée : l'entrée surlignée
 * ne doit jamais être cachée derrière un repli. Les autres se replient et
 * se déplient librement, et gardent leur état tant que la barre reste
 * montée — c'est-à-dire pendant toute la navigation, la barre vivant dans
 * le layout. Ce commentaire fait foi.
 *
 * Aucun état n'est lu au montage : le rendu du serveur et celui du client
 * partent du même chemin et donnent le même arbre.
 */
export function NavTree({
  sections,
  home,
  footerItem,
  onNavigate,
}: {
  sections: NavSection[];
  home: NavItem;
  footerItem?: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const current = activeSectionId(sections, pathname);
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-1">
      <NavLink item={home} pathname={pathname} onNavigate={onNavigate} />

      {sections.map((section) => {
        const isCurrent = section.id === current;
        const isOpen = isCurrent || opened[section.id] === true;
        const count = section.items.length;

        return (
          <div key={section.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`nav-section-${section.id}`}
              disabled={isCurrent}
              onClick={() =>
                setOpened((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
              }
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 mt-2 rounded-xl",
                "text-xs font-semibold uppercase tracking-wide transition-colors",
                isCurrent
                  ? "text-sidebar-foreground/80 cursor-default"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/80"
              )}
            >
              <section.icon
                className={cn("h-4 w-4 shrink-0", isCurrent && "text-primary")}
              />
              <span className="flex-1 text-left whitespace-nowrap">
                {section.label}
              </span>
              <span
                dir="rtl"
                lang="ar"
                className="text-[0.7rem] font-normal normal-case tracking-normal text-sidebar-foreground/35 shrink-0"
              >
                {section.labelAr}
              </span>
              {isCurrent ? (
                <span className="w-4 shrink-0" aria-hidden />
              ) : (
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    isOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              )}
              <span className="sr-only">
                {isOpen
                  ? `Replier ${section.label}`
                  : `Déplier ${section.label} (${count} entrées)`}
              </span>
            </button>

            {isOpen && (
              <div
                id={`nav-section-${section.id}`}
                className="ml-3 pl-3 border-l border-sidebar-border space-y-1 mt-1"
              >
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {footerItem && (
        <div className="pt-2 mt-2 border-t border-sidebar-border">
          <NavLink item={footerItem} pathname={pathname} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = isItemActive(item.href, pathname);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 whitespace-nowrap">{item.label}</span>
      <span
        dir="rtl"
        lang="ar"
        className="text-xs text-sidebar-foreground/40 shrink-0 truncate max-w-24"
      >
        {item.labelAr}
      </span>
    </Link>
  );
}
