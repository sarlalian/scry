import type { Config } from "../config/index.ts";
import type { AuthProvider } from "./auth/index.ts";
import { BasicAuthProvider, BearerAuthProvider } from "./auth/index.ts";
import { AuthError, JiraApiError } from "../errors.ts";
import type { JiraErrorResponse } from "./types/common.ts";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

function createAuthProvider(config: Config): AuthProvider {
  const token = config.auth.token || "";

  switch (config.auth.type) {
    case "bearer":
      return new BearerAuthProvider(token);
    case "basic":
    default:
      return new BasicAuthProvider(config.login, token);
  }
}

export class JiraClient {
  private baseUrl: string;
  private auth: AuthProvider;

  constructor(config: Config) {
    if (!config.server) {
      throw new AuthError("Jira server URL not configured.");
    }
    this.baseUrl = config.server.replace(/\/$/, "");
    this.auth = createAuthProvider(config);
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.auth.getHeaders(),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let errorResponse: JiraErrorResponse;
      try {
        errorResponse = (await response.json()) as JiraErrorResponse;
      } catch {
        errorResponse = { errorMessages: [response.statusText] };
      }
      throw new JiraApiError(response.status, errorResponse);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  get<T>(endpoint: string, params?: RequestOptions["params"]): Promise<T> {
    return this.request<T>(endpoint, { params });
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

let defaultClient: JiraClient | null = null;

export function getJiraClient(config: Config): JiraClient {
  if (!defaultClient) {
    defaultClient = new JiraClient(config);
  }
  return defaultClient;
}

export function resetJiraClient(): void {
  defaultClient = null;
}
