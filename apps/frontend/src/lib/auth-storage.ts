import type { AuthUser, StoredAuthState } from "@/types/auth";

const ACCESS_TOKEN_KEY = "technician_crm.access_token";
const REFRESH_TOKEN_KEY = "technician_crm.refresh_token";
const USER_KEY = "technician_crm.user";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthStorage(input: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(input.user));
}

export function clearAuthStorage() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function readStoredAuthState(): StoredAuthState {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const user = getStoredUser();
  return { accessToken, refreshToken, user };
}

