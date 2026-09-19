import { requireAdmin } from "@/lib/auth-utils";
import { PostEditor } from "../post-editor";

export default async function NewPostPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nouvel article</h2>
        <p className="text-muted-foreground mt-1">
          Il est créé en brouillon : vos élèves ne le verront qu&apos;une fois
          publié.
        </p>
      </div>
      <PostEditor />
    </div>
  );
}
