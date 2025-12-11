import open from "open";

export async function openInBrowser(url: string): Promise<void> {
  if (!url || url.trim().length === 0) {
    throw new Error("URL is required");
  }

  try {
    await open(url);
  } catch (err) {
    throw new Error(`Failed to open browser: ${err instanceof Error ? err.message : String(err)}`);
  }
}
