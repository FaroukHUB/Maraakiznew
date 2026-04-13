"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updatePaymentStatus } from "@/actions/payments";

export function PaymentStatusButton({
  paymentId,
  targetStatus,
  label,
}: {
  paymentId: string;
  targetStatus: "pending" | "received" | "failed" | "refunded";
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await updatePaymentStatus(paymentId, targetStatus);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs text-success hover:text-success"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "..." : label}
    </Button>
  );
}
