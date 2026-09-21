"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addGroupMembers, removeGroupMember } from "@/actions/groups";

export type StudentGroup = {
  id: string;
  name: string;
  teacherName: string | null;
  schedule: string | null;
};

/**
 * Les groupes d'une élève, depuis sa fiche.
 *
 * Le rattachement se fait des deux côtés — depuis le groupe ou depuis
 * l'élève — et passe par les MÊMES actions (`addGroupMembers`,
 * `removeGroupMember`). Deux chemins d'écriture pour une même relation
 * finiraient par ne plus appliquer les mêmes règles, à commencer par la
 * capacité du groupe. Ce commentaire fait foi.
 */
export function GroupsPanel({
  profileId,
  current,
  available,
}: {
  profileId: string;
  current: StudentGroup[];
  available: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const joinable = available.filter(
    (group) => !current.some((mine) => mine.id === group.id)
  );

  function join(groupId: string) {
    if (!groupId) return;
    setError(null);
    startTransition(async () => {
      const result = await addGroupMembers(groupId, [profileId]);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  function leave(groupId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeGroupMember(groupId, profileId);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4 text-muted-foreground" />
        Groupes ({current.length})
      </h3>

      {current.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cette élève ne suit aucun groupe.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {current.map((group) => (
            <li
              key={group.id}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-accent/30 py-1 pl-3 pr-1 text-sm"
            >
              <Link href={`/admin/groups/${group.id}`} className="hover:text-primary">
                {group.name}
                {group.teacherName && (
                  <span className="text-muted-foreground"> · {group.teacherName}</span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => leave(group.id)}
                disabled={pending}
                aria-label={`Retirer du groupe ${group.name}`}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {joinable.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            onChange={(e) => {
              join(e.target.value);
              e.target.value = "";
            }}
            disabled={pending}
            aria-label="Ajouter à un groupe"
            className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Ajouter à un groupe…</option>
            {joinable.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {/* `render` fusionne le bouton avec le lien : un <a> dans un
              <button> serait invalide. */}
          <Button variant="ghost" size="sm" render={<Link href="/admin/groups" />}>
            Gérer
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
