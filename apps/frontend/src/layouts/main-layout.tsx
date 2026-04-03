import { CommandPaletteProvider } from "@/hooks/use-command-palette";
import { MainLayoutInner } from "@/layouts/main-layout-inner";

export function MainLayout() {
  return (
    <CommandPaletteProvider>
      <MainLayoutInner />
    </CommandPaletteProvider>
  );
}

