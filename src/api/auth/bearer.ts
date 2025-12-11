import type { AuthProvider } from "./index.ts";

export class BearerAuthProvider implements AuthProvider {
  constructor(private token: string) {}

  getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}
