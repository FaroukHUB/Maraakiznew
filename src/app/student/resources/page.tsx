import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getActivePackForStudent } from "@/data/packs";
import { getResourcesByProgramId } from "@/data/resources";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, Headphones, LinkIcon, Presentation } from "lucide-react";

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  link: LinkIcon,
  slide: Presentation,
};

export default async function ResourcesPage() {
  const user = await requireStudent();
  const student = await getStudentByUserId(user.id);
  const activePack = student
    ? await getActivePackForStudent(student.profile.id)
    : null;

  const resources = await getResourcesByProgramId(activePack?.programId ?? null);
  const categories = [...new Set(resources.map((r) => r.category).filter(Boolean))];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Ressources</h2>
        <p className="text-muted-foreground mt-1">
          Supports de cours et documents utiles
        </p>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {resources
              .filter((r) => r.category === category)
              .map((resource) => {
                const Icon = typeIcons[resource.type] ?? FileText;
                return (
                  <Card key={resource.id} className="hover:bg-accent/30 transition-colors">
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {resource.title}
                        </p>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 ml-auto">
                        {resource.type.toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
