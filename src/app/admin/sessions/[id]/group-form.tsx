"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { attachSessionToGroup } from "@/actions/groups";

export function GroupForm({
  sessionId,
  currentGroup,
  groups,
}: {
  sessionId: string;
  currentGroup: { id: string; name: string } | null;
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(currentGroup?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAttach() {
    if (!groupId) return;
    setPending(true);
    setError(null);

    const result = await attachSessionToGroup(sessionId, groupId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun groupe actif.{" "}
        <Link href="/admin/groups/new" className="text-primary hover:underline">
          Créer un groupe
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {currentGroup && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rattachée à</span>
          <Link href={`/admin/groups/${currentGroup.id}`}>
            <Badge variant="outline" className="hover:border-primary">
              {currentGroup.name}
            </Badge>
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">Choisir un groupe...</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={handleAttach}
          disabled={pending || !groupId || groupId === currentGroup?.id}
        >
          {pending ? "Rattachement..." : currentGroup ? "Changer de groupe" : "Rattacher"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Les élèves du groupe sont inscrites d&apos;office comme participantes.
        Les présences déjà saisies ne sont pas modifiées.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
