import { requireAdmin } from "@/lib/auth-utils";
import { getProgramsWithSkills } from "@/data/skills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks } from "lucide-react";
import { SkillsManager } from "./skills-manager";

export default async function AdminSkillsPage() {
  await requireAdmin();
  const programs = await getProgramsWithSkills();

  const totalSkills = programs.reduce((sum, p) => sum + p.activeSkillCount, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Référentiel</h2>
        <p className="text-muted-foreground mt-1">
          Les compétences de chaque programme, dans l&apos;ordre pédagogique.
          C&apos;est ce référentiel qui sert de base à la progression des élèves.
        </p>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun programme</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez d&apos;abord un programme pour lui attacher des compétences.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {totalSkills} compétence{totalSkills > 1 ? "s" : ""} active
            {totalSkills > 1 ? "s" : ""} sur {programs.length} programme
            {programs.length > 1 ? "s" : ""}
          </p>

          {programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base">{program.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {program.activeSkillCount} compétence
                    {program.activeSkillCount > 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <SkillsManager programId={program.id} skills={program.skills} />
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
