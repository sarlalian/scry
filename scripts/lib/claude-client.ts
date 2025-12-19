/**
 * Claude Code CLI wrapper for changelog generation
 *
 * Uses `claude --print` for non-interactive oneshot prompts
 */

import { $ } from "bun";

export class ClaudeClientError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ClaudeClientError";
  }
}

export async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  try {
    const result = await $`claude --print ${fullPrompt}`.text();
    return result.trim();
  } catch (error) {
    const err = error as Error & { exitCode?: number; stderr?: string };

    if (err.exitCode === 127) {
      throw new ClaudeClientError(
        "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code",
        "CLI_NOT_FOUND"
      );
    }

    throw new ClaudeClientError(`Claude Code CLI error: ${err.message}`, "CLI_ERROR");
  }
}
