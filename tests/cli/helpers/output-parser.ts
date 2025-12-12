export interface OutputWrapper<T> {
  data: T;
  meta?: {
    total?: number;
    maxResults?: number;
    startAt?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function parseJsonOutput<T>(stdout: string): OutputWrapper<T> {
  return JSON.parse(stdout) as OutputWrapper<T>;
}

export function extractIssueKey(stdout: string): string | null {
  // Parse "Key: TEST-123" from table/plain output
  const match = stdout.match(/Key:\s*([A-Z]+-\d+)/);
  if (match) return match[1] ?? null;

  // Try to find issue key in table format (first column)
  const tableMatch = stdout.match(/│\s*([A-Z]+-\d+)\s*│/);
  return tableMatch ? (tableMatch[1] ?? null) : null;
}

export function extractErrorMessage(output: string): string | null {
  // Try to parse as JSON error first
  try {
    const parsed = JSON.parse(output);
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Not JSON
  }

  // Try to find error message in plain text
  const errorMatch = output.match(/Error:\s*(.+)/i);
  return errorMatch ? (errorMatch[1]?.trim() ?? null) : null;
}

export function tableRowCount(stdout: string): number {
  // Count data rows in table output (excluding header/separator lines)
  const lines = stdout.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed && trimmed.startsWith("│") && !trimmed.includes("────") && !trimmed.includes("Key") // Exclude header row
    );
  });
  return lines.length;
}

export function hasTableHeader(stdout: string, header: string): boolean {
  return stdout.includes(header);
}

export function isValidXml(stdout: string): boolean {
  return (
    stdout.trim().startsWith("<?xml") &&
    (stdout.includes("<data>") || stdout.includes("<response>"))
  );
}

export function isValidJson(stdout: string): boolean {
  try {
    JSON.parse(stdout);
    return true;
  } catch {
    return false;
  }
}
