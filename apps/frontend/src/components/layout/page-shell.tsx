import type { PropsWithChildren } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type PageShellProps = PropsWithChildren<{
  title: string;
  description: string;
  note: string;
}>;

export function PageShell({ title, description, note, children }: PageShellProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <Card>
        <CardTitle>Module Placeholder</CardTitle>
        <CardDescription className="mt-2">{note}</CardDescription>
        {children ? <div className="mt-4">{children}</div> : null}
      </Card>
    </div>
  );
}

