import { Suspense } from "react";

export function FiltersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-3 flex-wrap">
          <div className="h-9 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
        </div>
      }
    >
      <div className="flex gap-3 flex-wrap">{children}</div>
    </Suspense>
  );
}
