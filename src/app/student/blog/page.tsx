import { requireStudent } from "@/lib/auth-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export default async function BlogPage() {
  await requireStudent();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Blog & Conseils</h2>
        <p className="text-muted-foreground mt-1">
          Rappels, fawaid et conseils pour progresser
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Les articles seront disponibles prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
