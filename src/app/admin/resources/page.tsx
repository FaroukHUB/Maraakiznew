import { requireAdmin } from "@/lib/auth-utils";
import { getAllResources } from "@/data/resources";
import { getAllPrograms } from "@/data/programs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Video, Headphones, LinkIcon, Presentation, Plus } from "lucide-react";
import { AddResourceForm } from "./add-resource-form";
import { DeleteResourceButton } from "./delete-resource-button";

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  link: LinkIcon,
  slide: Presentation,
};

const typeLabels: Record<string, string> = {
  pdf: "PDF",
  video: "Vidéo",
  audio: "Audio",
  link: "Lien",
  slide: "Diapo",
};

export default async function AdminResourcesPage() {
  await requireAdmin();
  const allResources = await getAllResources();
  const programs = await getAllPrograms();

  const categories = [...new Set(allResources.map((r) => r.category).filter(Boolean))];

  // Resources without category
  const uncategorized = allResources.filter((r) => !r.category);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ressources</h2>
          <p className="text-muted-foreground mt-1">
            {allResources.length} ressource{allResources.length > 1 ? "s" : ""} dans la bibliothèque
          </p>
        </div>
      </div>

      {/* Add form */}
      <AddResourceForm
        programs={programs.map((p) => ({ id: p.id, name: p.name }))}
        existingCategories={categories as string[]}
      />

      {/* By category */}
      {categories.map((category) => {
        const items = allResources.filter((r) => r.category === category);
        return (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {category} ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((resource) => {
                const Icon = typeIcons[resource.type] ?? FileText;
                const prog = programs.find((p) => p.id === resource.programId);
                return (
                  <Card key={resource.id}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{resource.title}</p>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {prog && (
                          <Badge variant="outline" className="text-xs">
                            {prog.name}
                          </Badge>
                        )}
                        {!prog && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Tous
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[resource.type] ?? resource.type}
                        </Badge>
                        <DeleteResourceButton resourceId={resource.id} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Sans catégorie ({uncategorized.length})
          </h3>
          <div className="space-y-2">
            {uncategorized.map((resource) => {
              const Icon = typeIcons[resource.type] ?? FileText;
              return (
                <Card key={resource.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.title}</p>
                    </div>
                    <DeleteResourceButton resourceId={resource.id} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
