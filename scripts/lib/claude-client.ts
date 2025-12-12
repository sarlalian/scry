/**
 * Claude API client for changelog generation
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: "text"; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeErrorResponse {
  type: "error";
  error: {
    type: string;
    message: string;
  };
}

export class ClaudeClientError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ClaudeClientError";
  }
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    throw new ClaudeClientError(
      "ANTHROPIC_API_KEY environment variable required for AI changelog generation",
      "NO_API_KEY"
    );
  }

  const model = process.env["SCRY_CHANGELOG_MODEL"] ?? DEFAULT_MODEL;

  const messages: ClaudeMessage[] = [{ role: "user", content: userPrompt }];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ClaudeErrorResponse | null;
    const errorMessage = errorData?.error?.message ?? `HTTP ${response.status}: ${response.statusText}`;
    throw new ClaudeClientError(`Claude API error: ${errorMessage}`, "API_ERROR");
  }

  const data = (await response.json()) as ClaudeResponse;

  if (!data.content?.[0]?.text) {
    throw new ClaudeClientError("Invalid response from Claude API: no content", "INVALID_RESPONSE");
  }

  return data.content[0].text;
}
