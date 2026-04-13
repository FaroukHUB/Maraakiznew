"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteResource } from "@/actions/resources";
import { Trash2 } from "lucide-react";

export function DeleteResourceButton({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer cette ressource ?")) return;
    setLoading(true);
    const result = await deleteResource(resourceId);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      disabled={loading}
      onClick={handleDelete}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
