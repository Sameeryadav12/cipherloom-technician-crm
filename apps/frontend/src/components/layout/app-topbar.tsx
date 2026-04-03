import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jobs": "Jobs",
  "/customers": "Customers",
  "/technicians": "Technicians",
  "/invoices": "Invoices",
  "/calendar": "Calendar",
  "/dispatch": "Dispatch",
  "/scheduling": "Smart Scheduling",
  "/settings": "Settings",
  "/technician/jobs": "My Jobs",
  "/technician/schedule": "My Schedule",
  "/technician": "My Dashboard"
};

function roleLabel(role?: string) {
  if (!role) return "User";
  return role.charAt(0) + role.slice(1).toLowerCase().replace("_", " ");
}

type AppTopbarProps = {
  onOpenCommand: () => void;
};

export function AppTopbar({ onOpenCommand }: AppTopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title =
    Object.entries(titleMap).find(([path]) => location.pathname.startsWith(path))?.[1] ??
    "Technician CRM";

  const onLogout = () => {
    auth.logout();
    navigate("/login", { replace: true });
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-[4.25rem] items-center justify-between gap-4 border-b border-border/80 bg-background/80 px-6 backdrop-blur-md md:px-8">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
          Operations
        </p>
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-2 border-border/90 bg-card/40 px-2.5 text-sm sm:inline-flex sm:px-3"
          onClick={onOpenCommand}
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4 opacity-80" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
            ⌘K
          </kbd>
        </Button>
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex max-w-[220px] items-center gap-2 rounded-lg border border-border/90 bg-card/50 px-3 py-2 text-left text-sm",
              "shadow-surface transition-colors hover:bg-card/80 hover:border-primary/25"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
              <User className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-foreground">
                {auth.user?.name ?? auth.user?.email ?? "Account"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {roleLabel(auth.user?.role)}
              </span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", menuOpen && "rotate-180")}
            />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border/90 bg-card py-1 shadow-surface-lg ring-1 ring-primary/10">
              <div className="border-b border-border/80 px-3 py-2">
                <p className="truncate text-xs font-medium">{auth.user?.email}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabel(auth.user?.role)}</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
