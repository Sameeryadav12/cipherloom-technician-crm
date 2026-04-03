import type { PropsWithChildren } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type RecentListCardProps = PropsWithChildren<{
  title: string;
  description: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyLabel: string;
}>;

export function RecentListCard({
  title,
  description,
  isLoading,
  isError,
  isEmpty,
  emptyLabel,
  children
}: RecentListCardProps) {
  return (
    <Card className="space-y-4 border-border/70">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-md bg-muted" />
          <div className="h-12 animate-pulse rounded-md bg-muted" />
          <div className="h-12 animate-pulse rounded-md bg-muted" />
        </div>
      ) : isError ? (
        <p className="rounded-md border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
          Unable to load this section right now.
        </p>
      ) : isEmpty ? (
        <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </Card>
  );
}
