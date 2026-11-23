import type { ApiErrorBody } from "@supseal/shared-types";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(", ") : body.message);
    this.status = status;
    this.body = body;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Set once by AuthProvider on mount. api.ts can't import the auth context
 * directly (that would create a circular dependency — the context itself
 * calls apiFetch to talk to the login/refresh endpoints), so this is the
 * seam: apiFetch calls back into whatever the app registered as "how to
 * silently refresh" when it gets a 401, and retries exactly once.
 */
type UnauthorizedHandler = () => Promise<string | null>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  unauthorizedHandler = fn;
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = () =>
    fetch(path, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401 && unauthorizedHandler && !path.endsWith("/auth/refresh")) {
    const newToken = await unauthorizedHandler();
    if (newToken) {
      accessToken = newToken;
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const body: ApiErrorBody = await res
      .json()
      .catch(() => ({ message: res.statusText, statusCode: res.status }));
    throw new ApiError(res.status, body);
  }

  return res;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await request(path, options);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * For authenticated file downloads (e.g. batch print PDFs). A plain <a href>
 * wouldn't carry the access token — it lives in memory, not a cookie — so
 * this fetches the file as a Blob and triggers a save via a throwaway
 * object URL instead.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await request(path);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
