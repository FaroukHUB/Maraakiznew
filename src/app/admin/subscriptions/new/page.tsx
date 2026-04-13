import { Suspense } from "react";
import { NewSubscriptionForm } from "./form";

export default function NewSubscriptionPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground p-4">Chargement...</p>}>
      <NewSubscriptionForm />
    </Suspense>
  );
}
