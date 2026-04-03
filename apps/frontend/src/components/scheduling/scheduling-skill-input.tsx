import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function normalizeSkills(items: string[]) {
  const next = items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, " "));

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const skill of next) {
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(skill);
  }
  return unique;
}

function splitInput(value: string) {
  return value
    .split(/[,\n]/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

type SchedulingSkillInputProps = {
  label?: string;
  value: string[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (next: string[]) => void;
};

export function SchedulingSkillInput({
  label = "Required skills",
  value,
  placeholder = "e.g. electrical, HVAC, ladder work",
  disabled,
  onChange
}: SchedulingSkillInputProps) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const skills = useMemo(() => normalizeSkills(value), [value]);

  const commitDraft = () => {
    if (!draft.trim()) return;
    const parts = splitInput(draft);
    const next = normalizeSkills([...skills, ...parts]);
    setDraft("");
    onChange(next);
  };

  const removeSkill = (skill: string) => {
    const next = skills.filter((s) => s.toLowerCase() !== skill.toLowerCase());
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            id={id}
            value={draft}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "," && draft.trim()) {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "Backspace" && !draft && skills.length > 0) {
                removeSkill(skills[skills.length - 1]!);
              }
            }}
            onBlur={() => {
              if (draft.trim()) commitDraft();
            }}
          />
          <Button
            variant="outline"
            disabled={disabled || !draft.trim()}
            className="h-10 px-3"
            onClick={commitDraft}
          >
            Add
          </Button>
        </div>

        {skills.length ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.toLowerCase()}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs",
                  disabled && "opacity-70"
                )}
              >
                <span className="text-foreground">{skill}</span>
                <button
                  type="button"
                  className="rounded-full px-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                  disabled={disabled}
                  aria-label={`Remove ${skill}`}
                  onClick={() => removeSkill(skill)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Optional. Add one or more skills to improve matching.
          </p>
        )}
      </div>
    </div>
  );
}

