"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { assignSessionStaff } from "@/actions/staff";
import { STAFF_ROLE_LABELS } from "@/lib/constants";

export function StaffAssignForm({
  sessionId,
  current,
  staff,
}: {
  sessionId: string;
  current: string | null;
  staff: { id: string; name: string; role: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (staff.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun membre actif.{" "}
        <Link href="/admin/staff" className="text-primary hover:underline">
          Ajouter un membre
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">Non attribuée</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} — {STAFF_ROLE_LABELS[member.role]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={pending || value === (current ?? "")}
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await assignSessionStaff(sessionId, value || null);
            if (result.success) router.refresh();
            else setError(result.error);
            setPending(false);
          }}
        >
          {pending ? "Attribution..." : "Attribuer"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        L&apos;attribution alimente la supervision et le calcul de la paie.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
