type TechnicianSkillsListProps = {
  skills: string[];
};

export function TechnicianSkillsList({ skills }: TechnicianSkillsListProps) {
  if (skills.length === 0) {
    return <span className="text-xs text-muted-foreground">No skills</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-xs"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

