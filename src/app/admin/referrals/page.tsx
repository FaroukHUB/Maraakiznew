import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getReferralsForAdmin, getPendingRewards, REFERRAL_STATUS_LABELS } from "@/data/referrals";
import { getAllStudentsWithDetails } from "@/data/students";
import { getReferralCodeForStudent } from "@/data/referrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Handshake } from "lucide-react";
import { ReferralPanel, ReferralStatusButton } from "./referral-panel";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export default async function AdminReferralsPage() {
  await requireAdmin();
  const [list, rewards, students] = await Promise.all([
    getReferralsForAdmin(),
    getPendingRewards(),
    getAllStudentsWithDetails(),
  ]);

  const withCodes = await Promise.all(
    students.map(async (s) => ({
      profileId: s.profile.id,
      name: s.name,
      code: (await getReferralCodeForStudent(s.profile.id))?.code ?? null,
    }))
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Parrainage</h2>
        <p className="text-muted-foreground mt-1">
          Une récompense n&apos;est acquise qu&apos;à l&apos;inscription de la
          filleule, pas à la simple recommandation.
          {rewards.count > 0 &&
            ` ${rewards.count} récompense${rewards.count > 1 ? "s" : ""} à remettre — ${formatMoney(rewards.totalCents)}.`}
        </p>
      </div>

      <ReferralPanel students={withCodes} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parrainages ({list.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="py-8 text-center">
              <Handshake className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucun parrainage. Rattachez un prospect au code d&apos;une élève.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {list.map((referral) => (
                <div
                  key={referral.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      <Link
                        href={`/admin/students/${referral.referrerProfileId}`}
                        className="font-medium hover:text-primary"
                      >
                        {referral.referrer.user.name}
                      </Link>
                      <span className="text-muted-foreground"> a parrainé </span>
                      {referral.referred ? (
                        <Link
                          href={`/admin/students/${referral.referredProfileId}`}
                          className="font-medium hover:text-primary"
                        >
                          {referral.referred.user.name}
                        </Link>
                      ) : (
                        <span className="font-medium">
                          {referral.prospect?.name ?? "—"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm">{formatMoney(referral.rewardCents)}</span>
                    <Badge variant="outline" className="text-xs">
                      {REFERRAL_STATUS_LABELS[referral.status]}
                    </Badge>
                    <ReferralStatusButton id={referral.id} status={referral.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
