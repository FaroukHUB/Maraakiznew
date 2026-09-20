import Link from "next/link";
import { requireStudent } from "@/lib/auth-utils";
import { getPublishedPosts } from "@/data/posts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Pin, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/datetime";
import { getViewerTimezone } from "@/data/timezones";

function formatOrDash(date: Date | null, timeZone: string): string {
  return date ? formatDate(date, timeZone) : "—";
}

export default async function StudentBlogPage() {
  const viewer = await requireStudent();
  const timeZone = await getViewerTimezone(viewer.id);
  const list = await getPublishedPosts();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Actualités</h2>
        <p className="text-muted-foreground mt-1">
          Les annonces et conseils de l&apos;institut.
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucune actualité</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((post) => (
            <Link key={post.id} href={`/student/blog/${post.slug}`} className="block">
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium flex items-center gap-1.5">
                        {post.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground mt-1.5">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
