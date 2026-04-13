import { requireAdmin } from "@/lib/auth-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export default async function AdminBlogPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-2xl font-bold">Blog</h2>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            La gestion du blog sera disponible dans la prochaine phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
