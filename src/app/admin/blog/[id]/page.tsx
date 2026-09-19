import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getPostById } from "@/data/posts";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "../post-editor";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux actualités
      </Link>

      <h2 className="text-2xl font-bold">{post.title}</h2>

      <PostEditor
        post={{
          id: post.id,
          title: post.title,
          category: post.category,
          excerpt: post.excerpt,
          content: post.content,
          status: post.status,
          pinned: post.pinned,
        }}
      />
    </div>
  );
}
