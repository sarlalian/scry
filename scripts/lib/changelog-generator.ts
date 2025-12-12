/**
 * AI-powered changelog generator using Claude API
 */

import { $ } from "bun";
import { callClaude, ClaudeClientError } from "./claude-client.ts";

export interface ChangelogEntry {
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
}

interface CommitInfo {
  hash: string;
  subject: string;
  body: string;
}

const SYSTEM_PROMPT = `You are a changelog generator. Given a list of git commits, generate a changelog entry following the Keep a Changelog format.

Rules:
- Categorize changes into: Added, Changed, Fixed, Removed
- Write entries from the user's perspective (what changed for them)
- Be concise but descriptive
- Group related commits into single entries when they address the same feature/fix
- Ignore commits like "chore: bump version", "chore(release):", merge commits, etc.
- Use present tense imperative mood ("Add feature" not "Added feature" or "Adds feature")
- Focus on user-facing changes, not internal refactoring unless significant
- If a commit type is "feat", it's typically "Added"
- If a commit type is "fix", it's typically "Fixed"
- If a commit type is "refactor" or changes behavior, it's typically "Changed"

Output ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "added": ["Feature description 1", "Feature description 2"],
  "changed": ["Change description"],
  "fixed": ["Bug fix description"],
  "removed": ["Removed feature description"]
}

If a category has no entries, use an empty array.`;

function buildUserPrompt(commits: CommitInfo[], version: string): string {
  const commitList = commits
    .map((c) => {
      let entry = `- ${c.hash.slice(0, 7)}: ${c.subject}`;
      if (c.body.trim()) {
        entry += `\n  ${c.body.trim().replace(/\n/g, "\n  ")}`;
      }
      return entry;
    })
    .join("\n");

  return `Generate a changelog for version ${version} from these commits:

${commitList}`;
}

export async function getCommitsSinceLastTag(): Promise<CommitInfo[]> {
  // Find the most recent version tag
  const tagsOutput = await $`git tag -l "v*" --sort=-v:refname`.text();
  const tags = tagsOutput.trim().split("\n").filter(Boolean);
  const lastTag = tags[0];

  let logRange: string;
  if (lastTag) {
    logRange = `${lastTag}..HEAD`;
  } else {
    // No tags yet, get all commits
    logRange = "HEAD";
  }

  // Get commits with hash, subject, and body separated by null characters
  const format = "%H%x00%s%x00%b%x00";
  const logOutput = await $`git log ${logRange} --format=${format}`.text();

  if (!logOutput.trim()) {
    return [];
  }

  const commits: CommitInfo[] = [];
  const entries = logOutput.split("\x00\x00").filter(Boolean);

  for (const entry of entries) {
    const parts = entry.split("\x00");
    if (parts.length >= 2) {
      commits.push({
        hash: parts[0]!.trim(),
        subject: parts[1]!.trim(),
        body: parts[2]?.trim() ?? "",
      });
    }
  }

  return commits;
}

export async function generateChangelog(version: string): Promise<ChangelogEntry | null> {
  const commits = await getCommitsSinceLastTag();

  if (commits.length === 0) {
    console.log("No commits found since last tag");
    return null;
  }

  // Limit to 50 commits to avoid token limits
  const limitedCommits = commits.slice(0, 50);
  if (commits.length > 50) {
    console.log(`Note: Limiting to most recent 50 commits (${commits.length} total)`);
  }

  console.log(`Analyzing ${limitedCommits.length} commits...`);

  const userPrompt = buildUserPrompt(limitedCommits, version);

  try {
    const response = await callClaude(SYSTEM_PROMPT, userPrompt);

    // Parse JSON response, handling potential markdown code blocks
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as ChangelogEntry;

    // Validate structure
    if (!Array.isArray(parsed.added)) parsed.added = [];
    if (!Array.isArray(parsed.changed)) parsed.changed = [];
    if (!Array.isArray(parsed.fixed)) parsed.fixed = [];
    if (!Array.isArray(parsed.removed)) parsed.removed = [];

    return parsed;
  } catch (error) {
    if (error instanceof ClaudeClientError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
    }
    throw error;
  }
}

export function formatChangelogMarkdown(entry: ChangelogEntry): string {
  const sections: string[] = [];

  if (entry.added.length > 0) {
    sections.push("### Added\n\n" + entry.added.map((item) => `- ${item}`).join("\n"));
  }

  if (entry.changed.length > 0) {
    sections.push("### Changed\n\n" + entry.changed.map((item) => `- ${item}`).join("\n"));
  }

  if (entry.fixed.length > 0) {
    sections.push("### Fixed\n\n" + entry.fixed.map((item) => `- ${item}`).join("\n"));
  }

  if (entry.removed.length > 0) {
    sections.push("### Removed\n\n" + entry.removed.map((item) => `- ${item}`).join("\n"));
  }

  return sections.join("\n\n");
}

export function hasContent(entry: ChangelogEntry): boolean {
  return (
    entry.added.length > 0 || entry.changed.length > 0 || entry.fixed.length > 0 || entry.removed.length > 0
  );
}
