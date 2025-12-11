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
