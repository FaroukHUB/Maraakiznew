import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";

export async function getPostsForAdmin() {
  return db.query.posts.findMany({
    orderBy: [desc(posts.pinned), desc(posts.publishedAt), desc(posts.createdAt)],
    with: { author: true },
  });
}

export async function getPostById(id: string) {
  return db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { author: true },
  });
}

/** Articles publiés, épinglés d'abord puis du plus récent au plus ancien. */
export async function getPublishedPosts() {
  return db.query.posts.findMany({
    where: eq(posts.status, "published"),
    orderBy: [desc(posts.pinned), desc(posts.publishedAt)],
    with: { author: true },
  });
}

export async function getPublishedPostBySlug(slug: string) {
  return db.query.posts.findFirst({
    where: and(eq(posts.slug, slug), eq(posts.status, "published")),
    with: { author: true },
  });
}
