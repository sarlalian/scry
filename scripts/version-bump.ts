#!/usr/bin/env bun
/**
 * Version bump script for scry
 *
 * Usage:
 *   bun scripts/version-bump.ts patch   # 0.1.0 -> 0.1.1
 *   bun scripts/version-bump.ts minor   # 0.1.0 -> 0.2.0
 *   bun scripts/version-bump.ts major   # 0.1.0 -> 1.0.0
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required for AI changelog generation
 *   SCRY_CHANGELOG_MODEL - Optional, override Claude model (default: claude-sonnet-4-20250514)
 */

import { $ } from "bun";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  generateChangelog,
  formatChangelogMarkdown,
  hasContent,
  type ChangelogEntry,
} from "./lib/changelog-generator.ts";
import { ClaudeClientError } from "./lib/claude-client.ts";

type BumpType = "patch" | "minor" | "major";

const ROOT_DIR = join(import.meta.dir, "..");
const PACKAGE_JSON_PATH = join(ROOT_DIR, "package.json");
const CHANGELOG_PATH = join(ROOT_DIR, "CHANGELOG.md");

function parseVersion(version: string): [number, number, number] {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return [parseInt(match[1]!, 10), parseInt(match[2]!, 10), parseInt(match[3]!, 10)];
}

function bumpVersion(current: string, type: BumpType): string {
  const [major, minor, patch] = parseVersion(current);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updatePackageJson(newVersion: string): void {
  const content = readFileSync(PACKAGE_JSON_PATH, "utf-8");
  const pkg = JSON.parse(content);
  pkg.version = newVersion;
  writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`Updated package.json to version ${newVersion}`);
}

function updateChangelog(newVersion: string, aiChangelog: ChangelogEntry | null): void {
  let content = readFileSync(CHANGELOG_PATH, "utf-8");
  const today = getTodayDate();

  // Format AI-generated content or use empty template
  let newVersionContent: string;
  if (aiChangelog && hasContent(aiChangelog)) {
    newVersionContent = formatChangelogMarkdown(aiChangelog);
  } else {
    newVersionContent = "### Added\n\n### Changed\n\n### Fixed\n\n### Removed";
  }

  // Check if there's an [Unreleased] section
  const unreleasedMatch = content.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|$)/i);

  if (unreleasedMatch) {
    // Replace [Unreleased] section with new version
    content = content.replace(
      /## \[Unreleased\]\n[\s\S]*?(?=\n## \[|$)/i,
      `## [Unreleased]\n\n### Added\n\n### Changed\n\n### Fixed\n\n### Removed\n\n## [${newVersion}] - ${today}\n\n${newVersionContent}\n\n`
    );
  } else {
    // No Unreleased section, add new version section after the title
    const titleMatch = content.match(/^# .+\n/);
    if (titleMatch) {
      const insertPos = titleMatch[0].length;
      const newSection = `\n## [Unreleased]\n\n### Added\n\n### Changed\n\n### Fixed\n\n### Removed\n\n## [${newVersion}] - ${today}\n\n${newVersionContent}\n\n`;
      content = content.slice(0, insertPos) + newSection + content.slice(insertPos);
    }
  }

  writeFileSync(CHANGELOG_PATH, content);
  console.log(`Updated CHANGELOG.md with version ${newVersion}`);
}

async function promptUser(question: string): Promise<string> {
  process.stdout.write(question);
  for await (const line of console) {
    return line.trim();
  }
  return "";
}

async function reviewChangelog(changelog: ChangelogEntry): Promise<ChangelogEntry | null> {
  console.log("\n" + "=".repeat(50));
  console.log("Generated Changelog:");
  console.log("=".repeat(50) + "\n");
  console.log(formatChangelogMarkdown(changelog));
  console.log("\n" + "=".repeat(50));

  const answer = await promptUser("Accept this changelog? [Y/n/skip] ");
  const normalized = answer.toLowerCase();

  if (normalized === "n" || normalized === "no") {
    console.log("Changelog rejected. Opening editor...");
    return await editChangelog(changelog);
  } else if (normalized === "skip" || normalized === "s") {
    console.log("Skipping AI changelog, using empty template.");
    return null;
  }

  return changelog;
}

async function editChangelog(changelog: ChangelogEntry): Promise<ChangelogEntry | null> {
  const tempFile = join(ROOT_DIR, ".changelog-edit.json");
  writeFileSync(tempFile, JSON.stringify(changelog, null, 2));

  const editor = process.env["EDITOR"] ?? process.env["VISUAL"] ?? "vim";

  try {
    await $`${editor} ${tempFile}`.quiet();
    const edited = JSON.parse(readFileSync(tempFile, "utf-8")) as ChangelogEntry;
    await $`rm ${tempFile}`.quiet();
    return edited;
  } catch {
    console.log("Editor failed, using original changelog.");
    await $`rm -f ${tempFile}`.quiet();
    return changelog;
  }
}

async function gitCommitAndTag(newVersion: string): Promise<void> {
  // Stage the changed files
  await $`git add package.json CHANGELOG.md`.quiet();

  // Create commit
  const commitMessage = `chore(release): bump version to ${newVersion}`;
  await $`git commit -m ${commitMessage}`.quiet();
  console.log(`Created commit: ${commitMessage}`);

  // Create annotated tag
  const tagName = `v${newVersion}`;
  const tagMessage = `Release ${newVersion}`;
  await $`git tag -a ${tagName} -m ${tagMessage}`.quiet();
  console.log(`Created tag: ${tagName}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const bumpType = args[0] as BumpType | undefined;
  const skipAi = args.includes("--no-ai");

  if (!bumpType || !["patch", "minor", "major"].includes(bumpType)) {
    console.error("Usage: bun scripts/version-bump.ts <patch|minor|major> [--no-ai]");
    console.error("\nOptions:");
    console.error("  --no-ai    Skip AI changelog generation");
    process.exit(1);
  }

  // Check for uncommitted changes
  const status = await $`git status --porcelain`.text();
  if (status.trim()) {
    console.error("Error: Working directory has uncommitted changes.");
    console.error("Please commit or stash your changes before bumping version.");
    process.exit(1);
  }

  // Read current version
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
  const currentVersion = pkg.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`\nBumping version: ${currentVersion} -> ${newVersion}\n`);

  // Generate AI changelog (unless skipped)
  let aiChangelog: ChangelogEntry | null = null;

  if (!skipAi) {
    console.log("Generating changelog from commits...\n");
    try {
      const generated = await generateChangelog(newVersion);
      if (generated && hasContent(generated)) {
        aiChangelog = await reviewChangelog(generated);
      } else {
        console.log("No significant changes found in commits.");
      }
    } catch (error) {
      if (error instanceof ClaudeClientError && error.code === "NO_API_KEY") {
        console.log("Note: Set ANTHROPIC_API_KEY for AI-generated changelogs.");
        console.log("Continuing with empty changelog template.\n");
      } else {
        console.error("AI changelog generation failed:", (error as Error).message);
        console.log("Continuing with empty changelog template.\n");
      }
    }
  }

  // Update files
  updatePackageJson(newVersion);
  updateChangelog(newVersion, aiChangelog);

  // Git commit and tag
  await gitCommitAndTag(newVersion);

  console.log("\n" + "=".repeat(50));
  console.log(`Version ${newVersion} is ready!`);
  console.log("=".repeat(50));
  console.log("\nTo publish the release, run:");
  console.log(`  git push && git push --tags`);
  console.log("\nOr just push to main and auto-release will create the tag:");
  console.log(`  git push`);
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
