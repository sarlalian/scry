import { describe, expect, test } from "bun:test";
import { BearerAuthProvider } from "../../../../src/api/auth/bearer.ts";

describe("BearerAuthProvider", () => {
  test("returns bearer token in authorization header", () => {
    const token = "test-token-12345";
    const provider = new BearerAuthProvider(token);
    const headers = provider.getHeaders();

    expect(headers).toHaveProperty("Authorization");
    expect(headers["Authorization"]).toBe("Bearer test-token-12345");
  });

  test("handles empty token", () => {
    const provider = new BearerAuthProvider("");
    const headers = provider.getHeaders();

    expect(headers).toHaveProperty("Authorization");
    expect(headers["Authorization"]).toBe("Bearer ");
  });

  test("handles special characters in token", () => {
    const token = "token-with-special!@#$%^&*()_+";
    const provider = new BearerAuthProvider(token);
    const headers = provider.getHeaders();

    expect(headers["Authorization"]).toBe("Bearer token-with-special!@#$%^&*()_+");
  });

  test("returns object with Authorization key", () => {
    const provider = new BearerAuthProvider("token");
    const headers = provider.getHeaders();

    expect(Object.keys(headers)).toEqual(["Authorization"]);
  });
});
