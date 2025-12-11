import type { AuthProvider } from "./index.ts";

export class BasicAuthProvider implements AuthProvider {
  private credentials: string;

  constructor(username: string, token: string) {
    this.credentials = btoa(`${username}:${token}`);
  }

  getHeaders(): Record<string, string> {
    return {
      Authorization: `Basic ${this.credentials}`,
    };
  }
}
