"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteDocument } from "@/actions/documents";

export function DeleteDocumentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive shrink-0"
      aria-label="Supprimer le document"
      onClick={async () => {
        setPending(true);
        const result = await deleteDocument(id);
        if (result.success) router.refresh();
        setPending(false);
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
