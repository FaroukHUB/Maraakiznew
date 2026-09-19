"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound } from "lucide-react";
import { ensureReferralCode, setReferralStatus } from "@/actions/referrals";

export function ReferralPanel({
  students,
}: {
  students: { profileId: string; name: string; code: string | null }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <p className="text-sm font-medium">Codes de parrainage</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Le code est stable une fois attribué : c&apos;est ce que la
            marraine communique.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune élève.</p>
        ) : (
          <div className="divide-y divide-border">
            {students.map((student) => (
              <div
                key={student.profileId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-sm">{student.name}</span>
                {student.code ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    {student.code}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={pending === student.profileId}
                    onClick={async () => {
                      setPending(student.profileId);
                      setError(null);
                      const result = await ensureReferralCode(student.profileId);
                      if (result.success) router.refresh();
                      else setError(result.error);
                      setPending(null);
                    }}
                  >
                    <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                    Générer
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReferralStatusButton({
  id,
  status,
}: {
  id: string;
  status: "pending" | "earned" | "rewarded" | "expired";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "rewarded" || status === "expired") return null;

  const next = status === "earned" ? "rewarded" : "expired";
  const label = status === "earned" ? "Remettre" : "Sans suite";

  return (
    <div className="flex flex-col items-end">
      <Button
        size="sm"
        variant="outline"
        className="text-xs"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await setReferralStatus(id, next);
          if (result.success) router.refresh();
          else setError(result.error);
          setPending(false);
        }}
      >
        {label}
      </Button>
      {error && <span className="text-xs text-destructive mt-1">{error}</span>}
    </div>
  );
}
