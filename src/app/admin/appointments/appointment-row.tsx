"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus } from "@/actions/prospects";

const OUTCOMES = [
  { value: "done" as const, label: "Effectué" },
  { value: "no_show" as const, label: "Absente" },
  { value: "cancelled" as const, label: "Annulé" },
];

export function AppointmentRow({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle(status: (typeof OUTCOMES)[number]["value"]) {
    setPending(true);
    const result = await setAppointmentStatus(id, status);
    if (result.success) router.refresh();
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {OUTCOMES.map((outcome) => (
        <Button
          key={outcome.value}
          size="sm"
          variant="outline"
          className="text-xs"
          disabled={pending}
          onClick={() => handle(outcome.value)}
        >
          {outcome.label}
        </Button>
      ))}
    </div>
  );
}
