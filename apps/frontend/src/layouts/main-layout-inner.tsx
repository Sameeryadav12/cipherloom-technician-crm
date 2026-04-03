import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";

export function MainLayoutInner() {
  const { open, setOpen } = useCommandPalette();

  return (
    <div className="flex min-h-screen bg-transparent text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onOpenCommand={() => setOpen(true)} />
        <main className="flex-1 px-6 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
