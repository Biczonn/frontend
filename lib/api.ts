import { CONFIG } from "./config";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

interface RefreshResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  data?: unknown;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  let response: Response;
  try {
    response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REFRESH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return null;
  }

  if (typeof data !== "object" || data === null) return null;
  const outer = data as RefreshResponse;
  const tokenData = typeof outer.data === "object" && outer.data !== null
    ? outer.data as RefreshResponse
    : outer;
  const accessToken = tokenData.accessToken ?? tokenData.access_token;
  const nextRefreshToken = tokenData.refreshToken ?? tokenData.refresh_token ?? refreshToken;
  if (typeof accessToken !== "string" || !accessToken) return null;
  setTokens(accessToken, nextRefreshToken);
  return accessToken;
}

function getRefreshInFlight() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function expireSession() {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = CONFIG.ROUTES.LOGIN;
  }
}

function makeHeaders(
  defaultHeaders: Record<string, string>,
  headers: HeadersInit | undefined,
  token: string | null,
) {
  const result = new Headers(defaultHeaders);
  new Headers(headers).forEach((value, key) => result.set(key, value));
  if (token) result.set("Authorization", `Bearer ${token}`);
  return result;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers, ...restOptions } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const request = (token: string | null) =>
    fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers: makeHeaders(defaultHeaders, headers, token),
    });

  let response = await request(requiresAuth ? getAccessToken() : null);

  if (response.status === 401 && requiresAuth) {
    const refreshedToken = await getRefreshInFlight();
    if (refreshedToken) {
      response = await request(refreshedToken);
    }

    if (!refreshedToken || response.status === 401) {
      expireSession();
      throw new Error("Session expired. Please log in again.");
    }
  }

  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const errorBody = typeof data === "object" && data !== null
      ? data as { message?: unknown }
      : undefined;
    const message = errorBody?.message;
    const errorMessage = Array.isArray(message)
      ? message.join(", ")
      : typeof message === "string" && message.trim()
        ? message
        : "An unexpected error occurred.";
    throw new Error(errorMessage);
  }

  return data as T;
}
