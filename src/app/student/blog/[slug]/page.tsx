import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth-utils";
import { getPublishedPostBySlug } from "@/data/posts";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/datetime";
import { getViewerTimezone } from "@/data/timezones";

function formatOrDash(date: Date | null, timeZone: string): string {
  return date ? formatDate(date, timeZone) : "—";
}

export default async function StudentPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const viewer = await requireStudent();
  const timeZone = await getViewerTimezone(viewer.id);
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // Le contenu est du texte : les paragraphes sont séparés par une ligne
  // vide. Pas de markdown, pas d'HTML injecté — on rend du texte.
  const paragraphs = post.content.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <article className="space-y-6 max-w-2xl">
      <Link
        href="/student/blog"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Toutes les actualités
      </Link>

      <header className="space-y-3 border-b border-border pb-4">
        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {post.category && <Badge variant="outline">{post.category}</Badge>}
          <span className="text-sm text-muted-foreground">
            {formatOrDash(post.publishedAt, timeZone)}
            {post.author?.name && ` · ${post.author.name}`}
          </span>
        </div>
      </header>

      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
