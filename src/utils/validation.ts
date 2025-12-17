import { ScryError } from "../errors.ts";

/**
 * Validates if a string matches the Jira issue key format: PROJECT-NUMBER
 * @param key - The issue key to validate (e.g., "PROJ-123")
 * @returns true if valid, false otherwise
 */
export function isValidIssueKey(key: string): boolean {
  return /^[A-Z]+-\d+$/.test(key);
}

/**
 * Validates multiple issue keys
 * @param keys - Array of issue keys to validate
 * @returns Object with valid flag and array of invalid keys
 */
export function validateIssueKeys(keys: string[]): {
  valid: boolean;
  invalidKeys: string[];
} {
  const invalidKeys = keys.filter((key) => !isValidIssueKey(key));
  return {
    valid: invalidKeys.length === 0,
    invalidKeys,
  };
}

/**
 * Validates a single issue key and throws ScryError if invalid
 * @param key - The issue key to validate
 * @throws ScryError if the key is invalid
 */
export function requireValidIssueKey(key: string): void {
  if (!isValidIssueKey(key)) {
    throw new ScryError(
      `Invalid issue key format: ${key}. Issue keys must be in the format: PROJECT-123`,
      "INVALID_ISSUE_KEY"
    );
  }
}

/**
 * Validates multiple issue keys and throws ScryError if any are invalid
 * @param keys - Array of issue keys to validate
 * @throws ScryError if any keys are invalid
 */
export function requireValidIssueKeys(keys: string[]): void {
  const validation = validateIssueKeys(keys);
  if (!validation.valid) {
    throw new ScryError(
      `Invalid issue key format: ${validation.invalidKeys.join(", ")}. ` +
        `Issue keys must be in the format: PROJECT-123`,
      "INVALID_ISSUE_KEY"
    );
  }
}

/**
 * Parses a string containing issue keys separated by spaces, commas, or both
 * @param input - String containing one or more issue keys
 * @returns Array of trimmed issue keys
 */
export function parseIssueKeys(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}
