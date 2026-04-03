import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import {
  AUTH_EXPIRED_EVENT,
  ApiError,
} from "@/lib/api-client";
import {
  clearAuthStorage,
  readStoredAuthState,
  setAuthStorage
} from "@/lib/auth-storage";
import { loginApi, refreshApi } from "@/services/auth/auth.api";
import type {
  AuthContextValue,
  LoginRequest,
  LoginResponse
} from "@/types/auth";

type LoginEnvelope =
  | LoginResponse
  | {
      data?: LoginResponse;
    };

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeLoginResponse(payload: LoginEnvelope): LoginResponse | null {
  if (!payload || typeof payload !== "object") return null;
  const source = "data" in payload && payload.data ? payload.data : payload;
  if (
    !source ||
    typeof source !== "object" ||
    !("user" in source) ||
    !("accessToken" in source) ||
    !("refreshToken" in source)
  ) {
    return null;
  }

  const user = (source as { user: unknown }).user;
  const accessToken = (source as { accessToken: unknown }).accessToken;
  const refreshToken = (source as { refreshToken: unknown }).refreshToken;

  if (
    !user ||
    typeof user !== "object" ||
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string"
  ) {
    return null;
  }

  return {
    user: user as LoginResponse["user"],
    accessToken,
    refreshToken
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const stored = readStoredAuthState();
      if (!stored.accessToken || !stored.refreshToken || !stored.user) {
        clearAuthStorage();
        if (mounted) setIsLoading(false);
        return;
      }
      try {
        const refreshed = await refreshApi(stored.refreshToken);
        const normalized = normalizeLoginResponse(refreshed);
        if (!normalized) throw new Error("Unexpected refresh response");
        setAuthStorage(normalized);
        if (!mounted) return;
        setUser(normalized.user);
        setAccessToken(normalized.accessToken);
        setRefreshToken(normalized.refreshToken);
      } catch (error) {
        clearAuthStorage();
        if (!mounted) return;
        if (!(error instanceof ApiError && error.status === 401)) {
          // ignore non-auth bootstrap errors while still forcing safe logout
        }
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuthStorage();
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await loginApi(payload);
    const normalized = normalizeLoginResponse(response);
    if (!normalized) {
      throw new Error("Unexpected login response from server");
    }

    setAuthStorage(normalized);
    setUser(normalized.user);
    setAccessToken(normalized.accessToken);
    setRefreshToken(normalized.refreshToken);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      logout
    }),
    [accessToken, isLoading, login, logout, refreshToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

