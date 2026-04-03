type TechnicianColorSwatchProps = {
  color?: string | null;
};

export function TechnicianColorSwatch({ color }: TechnicianColorSwatchProps) {
  const value = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#475569";
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-full border border-border"
        style={{ backgroundColor: value }}
      />
      <span className="text-xs text-muted-foreground">{color ?? "-"}</span>
    </div>
  );
}

