import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type CustomerSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CustomerSearchBar({ value, onChange }: CustomerSearchBarProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name, email, or phone..."
      />
    </div>
  );
}

