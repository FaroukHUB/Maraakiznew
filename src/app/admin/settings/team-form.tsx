"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addInstituteMember,
  setMemberRole,
  revokeInstituteMember,
} from "@/actions/institute";
import type { Member } from "@/data/institute";

/**
 * L'équipe de l'établissement.
 *
 * ── Ce que l'écran doit rendre évident ──
 *
 * Qui peut faire quoi, et d'où vient ce droit. Le rôle donne un socle ;
 * les droits ajoutés sont montrés à part, sinon retirer un droit « déjà
 * donné par le rôle » resterait sans effet. Ce commentaire fait foi.
 */

const ROLE_LABELS: Record<Member["role"], string> = {
  owner: "Propriétaire",
  manager: "Direction",
  teacher: "Enseignante",
  assistant: "Assistante",
};

const ROLE_HELP: Record<Member["role"], string> = {
  owner: "Tous les droits, y compris l'équipe et les réglages.",
  manager: "Tout gérer, sauf l'équipe et les réglages de l'établissement.",
  teacher: "Ses séances, l'assiduité, le suivi des élèves.",
  assistant: "Consulter, et tenir l'assiduité.",
};

const CAPABILITY_LABELS: Record<string, string> = {
  "institute.manage": "Équipe et réglages",
  "students.manage": "Élèves",
  "groups.manage": "Groupes",
  "sessions.manage": "Séances",
  "attendance.manage": "Assiduité",
  "finance.manage": "Factures et paiements",
  "content.manage": "Contenus et matières",
  "reports.view": "Bulletins et rapports",
};

export function TeamForm({
  members,
  instituteName,
  canManage,
}: {
  members: Member[];
  instituteName: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function revoke(userId: string, name: string) {
    if (!confirm(`Retirer ${name} de ${instituteName} ?`)) return;
    setPending(true);
    setError(null);
    const result = await revokeInstituteMember(userId);
    if (result.success) router.refresh();
    else setError(result.error);
    setPending(false);
  }

  const active = members.filter((m) => m.status === "active");
  const revoked = members.filter((m) => m.status !== "active");

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <ul className="divide-y divide-border">
          {active.map((member) => (
            <li
              key={member.userId}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{member.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {member.email}
                </p>
                {member.extra.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Droits ajoutés :{" "}
                    {member.extra
                      .map((c) => CAPABILITY_LABELS[c] ?? c)
                      .join(", ")}
                  </p>
                )}
              </div>

              <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>

              {canManage && (
                <div className="flex items-center gap-1">
                  <MemberDialog
                    member={member}
                    trigger={
                      <Button variant="ghost" size="sm">
                        Modifier
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => revoke(member.userId, member.name)}
                    aria-label={`Retirer ${member.name}`}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {revoked.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {revoked.length} appartenance(s) retirée(s) :{" "}
            {revoked.map((m) => m.name).join(", ")}. L&apos;historique de leur
            travail est conservé.
          </p>
        )}

        {canManage && <MemberDialog />}
      </CardContent>
    </Card>
  );
}

function MemberDialog({
  member,
  trigger,
}: {
  member?: Member;
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState<Member["role"]>(member?.role ?? "teacher");
  const [extra, setExtra] = useState<string[]>(member?.extra ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = member
      ? await setMemberRole(member.userId, role, extra as never)
      : await addInstituteMember(email, role);
    setPending(false);
    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/*
        `render` FUSIONNE le déclencheur avec l'élément fourni : le passer
        en enfant ferait un <button> dans un <button>.
      */}
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Rattacher quelqu&apos;un
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {member ? `Droits de ${member.name}` : "Rattacher quelqu'un"}
          </DialogTitle>
          <DialogDescription render={<div />}>
            {member ? (
              <p>Le changement prend effet à sa prochaine action.</p>
            ) : (
              <p>
                La personne doit déjà avoir un compte sur Maraakiz. Un compte
                élève ne peut pas administrer un établissement.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {!member && (
            <div className="space-y-1.5">
              <Label htmlFor="membre-email">Adresse email du compte</Label>
              <Input
                id="membre-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Rôle</legend>
            {(Object.keys(ROLE_LABELS) as Member["role"][]).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm has-checked:border-primary"
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{ROLE_LABELS[value]}</span>
                  <span className="block text-muted-foreground">
                    {ROLE_HELP[value]}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {member && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Droits accordés en plus du rôle
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(CAPABILITY_LABELS).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={extra.includes(value)}
                      onChange={(e) =>
                        setExtra((prev) =>
                          e.target.checked
                            ? [...prev, value]
                            : prev.filter((c) => c !== value)
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
