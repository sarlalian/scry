export interface AuthProvider {
  getHeaders(): Record<string, string>;
}

export { BasicAuthProvider } from "./basic.ts";
export { BearerAuthProvider } from "./bearer.ts";
