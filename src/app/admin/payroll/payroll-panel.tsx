"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { generatePayroll, setPayrollStatus } from "@/actions/staff";
import { STAFF_ROLE_LABELS } from "@/lib/constants";

function PayrollPanelBase({
  period,
  staff,
}: {
  period: string;
  staff: { id: string; name: string; role: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  function changePeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("period", value);
    else params.delete("period");
    router.replace(`${pathname}?${params.toString()}`);
  }

  async function generate() {
    setPending(true);
    setError(null);
    const targets = selected.length > 0 ? selected : staff.map((s) => s.id);

    for (const id of targets) {
      const result = await generatePayroll(id, period);
      if (!result.success) {
        setError(result.error);
        break;
      }
    }
    router.refresh();
    setPending(false);
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="period" className="text-sm font-medium">
              Période
            </label>
            <Input
              id="period"
              type="month"
              value={period}
              onChange={(e) => changePeriod(e.target.value)}
              className="w-44"
            />
          </div>
          <Button disabled={pending || staff.length === 0} onClick={generate}>
            <Calculator className="h-4 w-4 mr-2" />
            {pending ? "Calcul..." : "Calculer les bulletins"}
          </Button>
        </div>

        {staff.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {staff.map((member) => (
              <button
                key={member.id}
                onClick={() =>
                  setSelected((prev) =>
                    prev.includes(member.id)
                      ? prev.filter((i) => i !== member.id)
                      : [...prev, member.id]
                  )
                }
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  selected.includes(member.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {member.name}
                <span className="ml-1.5 opacity-60">
                  {STAFF_ROLE_LABELS[member.role]}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Sans sélection, tous les membres actifs sont calculés. Un bulletin
          déjà payé est ignoré.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

function StatusButton({ id, status }: { id: string; status: "draft" | "paid" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await setPayrollStatus(id, status === "paid" ? "draft" : "paid");
        if (result.success) router.refresh();
        setPending(false);
      }}
    >
      {status === "paid" ? "Annuler le paiement" : "Marquer payé"}
    </Button>
  );
}

export const PayrollPanel = Object.assign(PayrollPanelBase, { StatusButton });
