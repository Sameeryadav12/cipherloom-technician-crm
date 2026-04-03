export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF" | "TECHNICIAN";
};

export type SessionState = {
  isAuthenticated: boolean;
  user: SessionUser | null;
};

/**
 * Placeholder session hook for skeleton phase.
 * Replace with real auth context + token storage on next step.
 */
export function useSession(): SessionState {
  return {
    isAuthenticated: true,
    user: {
      id: "demo-user",
      email: "admin@cipherloom.local",
      role: "ADMIN"
    }
  };
}

