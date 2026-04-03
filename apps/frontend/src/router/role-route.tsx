import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

type RoleRouteProps = {
  allow: Array<"ADMIN" | "STAFF" | "TECHNICIAN">;
  redirectTo: string;
};

export function RoleRoute({ allow, redirectTo }: RoleRouteProps) {
  const location = useLocation();
  const auth = useAuth();

  if (!auth.user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!allow.includes(auth.user.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}
