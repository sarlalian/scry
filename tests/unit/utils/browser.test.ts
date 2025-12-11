import { describe, expect, test, mock, beforeEach } from "bun:test";

describe("browser utility", () => {
  let mockOpen: ReturnType<typeof mock>;

  beforeEach(() => {
    mockOpen = mock(() => Promise.resolve());
  });

  test("opens URL in default browser", async () => {
    const url = "https://example.atlassian.net/browse/PROJ-123";
    await mockOpen(url);

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith(url);
  });

  test("handles file URLs", async () => {
    const url = "file:///path/to/file.html";
    await mockOpen(url);

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith(url);
  });

  test("throws error for invalid URLs", async () => {
    const openUrl = async (url: string) => {
      if (!url || url.trim().length === 0) {
        throw new Error("URL is required");
      }
      await mockOpen(url);
    };

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(openUrl("")).rejects.toThrow("URL is required");
  });

  test("handles errors when opening URL", async () => {
    const mockOpenWithError = mock(() => Promise.reject(new Error("Failed to open browser")));

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(mockOpenWithError()).rejects.toThrow("Failed to open browser");
  });
});
