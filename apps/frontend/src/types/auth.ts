export type AuthUser = {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF" | "TECHNICIAN";
  name?: string;
  isActive?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type StoredAuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

