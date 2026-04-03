import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAuthStorage
} from "@/lib/auth-storage";
import { reportError } from "@/lib/error-reporter";

function resolveApiBaseUrl(): string {
  const raw = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
  if (raw !== undefined && String(raw).trim() !== "") {
    return String(raw).replace(/\/+$/, "");
  }
  // Dev: match the host you opened the app on (localhost vs 127.0.0.1) so API is same-site and reachable.
  if (import.meta.env.DEV) {
    if (typeof window !== "undefined" && window.location.hostname) {
      return `http://${window.location.hostname}:4000`;
    }
    return "http://127.0.0.1:4000";
  }
  return "http://localhost:4000";
}

const API_BASE_URL = resolveApiBaseUrl();

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details ?? null;
  }
}

type RequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
  token?: string | null;
  skipAuth?: boolean;
  _retryAfterRefresh?: boolean;
};

const AUTH_EXPIRED_EVENT = "auth:expired";
let refreshPromise: Promise<string | null> | null = null;

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function attemptRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) return null;
    const text = await response.text();
    const data = parseJson(text) as
      | {
          data?: {
            user?: unknown;
            accessToken?: unknown;
            refreshToken?: unknown;
          };
        }
      | null;
    const payload = data?.data;
    if (
      !payload ||
      typeof payload.user !== "object" ||
      typeof payload.accessToken !== "string" ||
      typeof payload.refreshToken !== "string"
    ) {
      return null;
    }
    setAuthStorage({
      user: payload.user as Parameters<typeof setAuthStorage>[0]["user"],
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken
    });
    return payload.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function request<T>(method: ApiMethod, path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {})
  };

  const authToken = options.skipAuth ? null : (options.token ?? getAccessToken());
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeout));

  const text = await response.text();
  const data = parseJson(text);

  if (!response.ok) {
    if (
      response.status === 401 &&
      !options.skipAuth &&
      !options._retryAfterRefresh &&
      !path.startsWith("/api/auth/")
    ) {
      const nextAccessToken = await attemptRefreshToken();
      if (nextAccessToken) {
        return request<T>(method, path, {
          ...options,
          token: nextAccessToken,
          _retryAfterRefresh: true
        });
      }
      clearAuthStorage();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: unknown }).message ?? "Request failed")
        : "Request failed";
    if (response.status >= 500) {
      reportError(new ApiError(message, response.status, data), {
        area: "api-client",
        path,
        method
      });
    }
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options)
};

export { AUTH_EXPIRED_EVENT };

