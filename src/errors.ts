import type { JiraErrorResponse } from "./api/types/common.ts";

export class ScryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ScryError";
  }
}

export class AuthError extends ScryError {
  constructor(message: string, details?: unknown) {
    super(message, "AUTH_ERROR", details);
    this.name = "AuthError";
  }
}

export class JiraApiError extends ScryError {
  constructor(
    public statusCode: number,
    public response: JiraErrorResponse
  ) {
    const message =
      response.errorMessages?.join(", ") ||
      (response.errors ? Object.values(response.errors).join(", ") : null) ||
      `HTTP ${statusCode}`;

    super(message, "JIRA_API_ERROR", response);
    this.name = "JiraApiError";
  }
}
