import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function getPostsForAdmin() {
  const institute = await requireInstitute();
  return db.query.posts.findMany({
    where: eq(posts.instituteId, institute),
    orderBy: [desc(posts.pinned), desc(posts.publishedAt), desc(posts.createdAt)],
    with: { author: true },
  });
}

export async function getPostById(id: string) {
  const institute = await requireInstitute();
  return db.query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.instituteId, institute)),
    with: { author: true },
  });
}

/** Articles publiés, épinglés d'abord puis du plus récent au plus ancien. */
export async function getPublishedPosts() {
  const institute = await requireInstitute();
  return db.query.posts.findMany({
    where: and(
      eq(posts.status, "published"),
      eq(posts.instituteId, institute)
    ),
    orderBy: [desc(posts.pinned), desc(posts.publishedAt)],
    with: { author: true },
  });
}

export async function getPublishedPostBySlug(slug: string) {
  const institute = await requireInstitute();
  return db.query.posts.findFirst({
    where: and(
      eq(posts.slug, slug),
      eq(posts.status, "published"),
      eq(posts.instituteId, institute)
    ),
    with: { author: true },
  });
}
