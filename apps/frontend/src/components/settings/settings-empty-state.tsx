import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type SettingsEmptyStateProps = {
  title: string;
  description: string;
};

export function SettingsEmptyState({ title, description }: SettingsEmptyStateProps) {
  return (
    <Card>
      <CardTitle className="text-base">{title}</CardTitle>
      <CardDescription className="mt-2">{description}</CardDescription>
    </Card>
  );
}
