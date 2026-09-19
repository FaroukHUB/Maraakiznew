"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavTree } from "./nav-tree";
import {
  adminHome,
  adminSections,
  adminSettings,
  studentHome,
  studentProfile,
  studentSections,
} from "@/lib/navigation";

export function MobileNav({ variant }: { variant: "student" | "admin" }) {
  const [open, setOpen] = useState(false);
  const isAdmin = variant === "admin";

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary font-arabic">مراكز</span>
              <span className="text-lg font-semibold">Maraakiz</span>
            </div>
            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-1">Administration</p>
            )}
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            <NavTree
              sections={isAdmin ? adminSections : studentSections}
              home={isAdmin ? adminHome : studentHome}
              footerItem={isAdmin ? adminSettings : studentProfile}
              onNavigate={() => setOpen(false)}
            />
          </nav>
          <div className="p-4 border-t border-border">
            <form
              action={async () => {
                const { signOut } = await import("next-auth/react");
                signOut({ callbackUrl: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:bg-accent/50 hover:text-foreground transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                Se déconnecter
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
