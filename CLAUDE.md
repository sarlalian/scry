# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scry** is a feature-rich, interactive Jira command-line interface built in TypeScript with Bun. Inspired by [ankitpokhrel/jira-cli](https://github.com/ankitpokhrel/jira-cli), it supports all basic Jira objects (Issues, Epics, Sprints, Projects, Boards, Releases, Users) and provides JSON/XML output formats for AI coding agent integration.

## Development Commands

```bash
bun install              # Install dependencies
bun run dev              # Run in development mode
bun run src/index.ts     # Run the CLI directly
bun --hot src/index.ts   # Run with hot module reloading
bun test                 # Run tests
bun test --watch         # Run tests in watch mode
bun test --coverage      # Run tests with coverage
bun run build:local      # Build local binary to dist/scry
bun run build            # Build cross-platform binaries
bun run lint             # Run ESLint
bun run typecheck        # Run TypeScript type checking
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Language | TypeScript 5.x |
| CLI Framework | Commander.js + @inquirer/prompts |
| HTTP Client | Native fetch (Bun) |
| Configuration | YAML + env vars (Bun auto-loads .env) |
| Output Formatting | chalk + cli-table3 + fast-xml-parser |
| TUI | @inquirer/prompts + ink |
| Build | Bun compile |
| Testing | Bun test |

## Architecture

```
src/
├── index.ts                # Entry point
├── cli/
│   ├── commands/           # Command implementations (issue/, epic/, sprint/, etc.)
│   └── middleware/         # Auth check, config loading, output format handler
├── api/
│   ├── client.ts           # HTTP client wrapper
│   ├── auth/               # Authentication providers (basic, bearer, oauth)
│   ├── endpoints/          # Jira API endpoint modules
│   └── types/              # TypeScript type definitions for Jira entities
├── config/                 # Config manager, schema, paths
├── output/
│   ├── formatters/         # table, plain, json, xml output
│   └── renderers/          # Entity-specific rendering
├── tui/                    # Terminal UI components (table, explorer, viewer)
└── utils/                  # JQL builder, date parsing, markdown, clipboard, browser
```

## Bun-Specific Guidelines

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build --compile` for creating standalone binaries
- Bun automatically loads .env files - don't use dotenv

### Bun APIs to Prefer

- `Bun.serve()` for HTTP servers (not express)
- `bun:sqlite` for SQLite (not better-sqlite3)
- `Bun.file` over `node:fs` readFile/writeFile
- `Bun.$\`cmd\`` for shell commands (not execa)
- Native `fetch` for HTTP requests
- Native `WebSocket` (not ws)

## Testing

```ts
import { describe, expect, test } from "bun:test";

test("example test", () => {
  expect(1).toBe(1);
});
```

## Key Jira API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/api/3/search/jql` | POST | Search issues using JQL |
| `/rest/api/3/issue` | POST | Create issue |
| `/rest/api/3/issue/{key}` | GET/PUT/DELETE | Get/Update/Delete issue |
| `/rest/api/3/issue/{key}/transitions` | GET/POST | Get/Execute transitions |
| `/rest/agile/1.0/board` | GET | List boards |
| `/rest/agile/1.0/board/{id}/sprint` | GET | List sprints |
| `/rest/api/3/myself` | GET | Get current user |

## Output Formats

All commands support `--output <format>` with: `table` (default), `plain`, `json`, `xml`, `csv`

JSON/XML outputs use a consistent wrapper:
```typescript
interface OutputWrapper<T> {
  data: T;
  meta?: { total?: number; maxResults?: number; startAt?: number; };
  error?: { code: string; message: string; };
}
```

## Configuration

Config file: `~/.config/scry/config.yml`

Environment variables:
- `SCRY_API_TOKEN` - Jira API token (required)
- `SCRY_SERVER` - Jira server URL
- `SCRY_PROJECT` - Default project key
- `SCRY_AUTH_TYPE` - Auth type: basic, bearer

## Error Handling

Custom error classes: `ScryError`, `ConfigError`, `AuthError`, `JiraApiError`

All errors support structured JSON/XML output when using those formats.

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

<!-- end-bv-agent-instructions -->
