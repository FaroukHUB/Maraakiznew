import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getPostsForAdmin } from "@/data/posts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Plus, Pin } from "lucide-react";
import { formatDayMonthYear } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";

function formatOrDash(date: Date | null, timeZone: string): string {
  return date ? formatDayMonthYear(date, timeZone) : "—";
}

export default async function AdminBlogPage() {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const list = await getPostsForAdmin();
  const published = list.filter((p) => p.status === "published").length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Actualités</h2>
          <p className="text-muted-foreground mt-1">
            {published} article{published > 1 ? "s" : ""} publié
            {published > 1 ? "s" : ""} sur {list.length}
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun article</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Annonces de l&apos;institut, conseils, rappels de dates — ce que
              vos élèves doivent lire.
            </p>
            <Link href="/admin/blog/new">
              <Button>Écrire le premier article</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map((post) => (
              <Link
                key={post.id}
                href={`/admin/blog/${post.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5">
                    {post.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                    {post.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {post.category && (
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatOrDash(post.publishedAt, timeZone)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    post.status === "published"
                      ? "text-success border-success/30 text-xs shrink-0"
                      : "text-muted-foreground text-xs shrink-0"
                  }
                >
                  {post.status === "published" ? "Publié" : "Brouillon"}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
