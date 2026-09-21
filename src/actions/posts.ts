"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { posts, slugify } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-utils";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const existing = await db.query.posts.findFirst({
    where: exceptId
      ? and(eq(posts.slug, slug), ne(posts.id, exceptId))
      : eq(posts.slug, slug),
  });
  return Boolean(existing);
}

export async function createPost(data: {
  title: string;
  content: string;
  category?: string;
  excerpt?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (!data.title.trim()) return { success: false, error: "Le titre est obligatoire." };
    if (!data.content.trim()) return { success: false, error: "Le contenu est obligatoire." };

    const slug = slugify(data.title);
    if (!slug) {
      return { success: false, error: "Ce titre ne permet pas de construire une adresse lisible." };
    }
    if (await slugTaken(slug)) {
      return {
        success: false,
        error: "Un article porte déjà ce titre. Choisissez-en un autre.",
      };
    }

    const user = await getCurrentUser();

    const [created] = await db
      .insert(posts)
      .values({
        title: data.title.trim(),
        slug,
        content: data.content.trim(),
        category: data.category?.trim() || null,
        excerpt: data.excerpt?.trim() || null,
        authorId: user?.id ?? null,
        status: "draft",
      })
      .returning();

    revalidatePath("/admin/blog");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la création de l'article." };
  }
}

export async function updatePost(
  id: string,
  data: {
    title?: string;
    content?: string;
    category?: string | null;
    excerpt?: string | null;
    pinned?: boolean;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const post = await db.query.posts.findFirst({ where: eq(posts.id, id) });
    if (!post) return { success: false, error: "Article introuvable." };

    let slug = post.slug;
    if (data.title !== undefined) {
      if (!data.title.trim()) return { success: false, error: "Le titre est obligatoire." };
      slug = slugify(data.title);
      if (await slugTaken(slug, id)) {
        return { success: false, error: "Un article porte déjà ce titre." };
      }
    }

    await db
      .update(posts)
      .set({
        ...(data.title !== undefined && { title: data.title.trim(), slug }),
        ...(data.content !== undefined && { content: data.content.trim() }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${id}`);
    revalidatePath("/student/blog");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de l'article." };
  }
}

export async function setPostStatus(
  id: string,
  status: "draft" | "published"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const post = await db.query.posts.findFirst({ where: eq(posts.id, id) });
    if (!post) return { success: false, error: "Article introuvable." };

    await db
      .update(posts)
      .set({
        status,
        // La date de publication est posée une seule fois : republier un
        // article ne le fait pas remonter comme s'il était neuf.
        publishedAt:
          status === "published" ? post.publishedAt ?? new Date() : post.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

    revalidatePath("/admin/blog");
    revalidatePath("/student/blog");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    await db.delete(posts).where(eq(posts.id, id));
    revalidatePath("/admin/blog");
    revalidatePath("/student/blog");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de l'article." };
  }
}
