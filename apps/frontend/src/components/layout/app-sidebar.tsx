import { CalendarDays, LayoutDashboard, Receipt, Settings, Users, Wrench, Briefcase, Sparkles, RadioTower } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/technicians", label: "Technicians", icon: Wrench },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/dispatch", label: "Dispatch", icon: RadioTower },
  { to: "/scheduling", label: "Scheduling", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings }
];

const technicianNavItems = [
  { to: "/technician", label: "Dashboard", icon: LayoutDashboard },
  { to: "/technician/jobs", label: "My Jobs", icon: Briefcase },
  { to: "/technician/schedule", label: "Schedule", icon: CalendarDays }
];

export function AppSidebar() {
  const { user } = useAuth();
  const navItems = user?.role === "TECHNICIAN" ? technicianNavItems : adminNavItems;
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-card/40 p-4 shadow-surface backdrop-blur-sm md:block">
      <div className="mb-8 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          Cipherloom
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Technician CRM</h2>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          Field service operations
        </p>
      </div>
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

