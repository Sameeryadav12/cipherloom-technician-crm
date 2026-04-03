import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AutomationRule } from "@/types/automation";

type AutomationRuleCardProps = {
  rule: AutomationRule;
  onToggle: (rule: AutomationRule) => void;
};

export function AutomationRuleCard({ rule, onToggle }: AutomationRuleCardProps) {
  return (
    <Card className="border-border/70 bg-card/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{rule.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">Key: {rule.key}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last run: {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString() : "Never"}
          </p>
        </div>
        <Button variant={rule.isEnabled ? "default" : "outline"} className="h-8 text-xs" onClick={() => onToggle(rule)}>
          {rule.isEnabled ? "Enabled" : "Disabled"}
        </Button>
      </div>
    </Card>
  );
}
