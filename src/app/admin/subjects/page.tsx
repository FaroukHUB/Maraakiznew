import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getSubjectsForAdmin } from "@/data/subjects";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { SubjectsManager } from "./subjects-manager";

export default async function AdminSubjectsPage() {
  await requireAdmin();
  const list = await getSubjectsForAdmin();
  const active = list.filter((s) => s.active);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Matières</h2>
        <p className="text-muted-foreground mt-1">
          {active.length} matière{active.length > 1 ? "s" : ""} active
          {active.length > 1 ? "s" : ""}. Chaque matière porte son référentiel
          de compétences et sert de base aux forfaits.
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucune matière</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <SubjectsManager subjects={list} />
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Les compétences de chaque matière se gèrent depuis le{" "}
        <Link href="/admin/skills" className="text-primary hover:underline">
          référentiel
        </Link>
        .
      </p>
    </div>
  );
}
