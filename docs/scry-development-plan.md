# Scry - TypeScript Jira CLI Development Plan

## Executive Summary

**Scry** is a feature-rich, interactive Jira command-line interface built in TypeScript, inspired by [ankitpokhrel/jira-cli](https://github.com/ankitpokhrel/jira-cli). It will support all basic Jira objects (Issues, Epics, Sprints, Projects, Boards, Releases, Users), provide JSON and XML output formats for AI coding agent integration, and compile to standalone binaries using Bun.

---

## 1. Project Architecture

### 1.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Bun | Native TypeScript support, fast startup, built-in bundler and test runner |
| **Language** | TypeScript 5.x | Type safety, excellent IDE support, better maintainability |
| **CLI Framework** | Commander.js + @inquirer/prompts | Mature ecosystem, excellent TypeScript support, interactive prompts |
| **HTTP Client** | Native fetch (Bun) | Zero dependencies, built-in to Bun |
| **Configuration** | YAML + dotenv | Human-readable config, environment variable support |
| **Output Formatting** | chalk + cli-table3 + fast-xml-parser | Colored output, table rendering, XML serialization |
| **TUI** | @inquirer/prompts + ink | Interactive selection, rich terminal UI |
| **Build** | Bun compile | Cross-platform standalone executables |
| **Testing** | Bun test | Built-in test runner, Jest-compatible |
| **CI/CD** | GitHub Actions | Build, test, release automation |

### 1.2 Directory Structure

```
scry/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Continuous integration
│       ├── release.yml         # Build and publish releases
│       └── test.yml            # Test runner
├── src/
│   ├── index.ts                # Entry point
│   ├── cli/
│   │   ├── index.ts            # CLI setup and command registration
│   │   ├── commands/
│   │   │   ├── issue/
│   │   │   │   ├── index.ts    # Issue command group
│   │   │   │   ├── list.ts
│   │   │   │   ├── create.ts
│   │   │   │   ├── view.ts
│   │   │   │   ├── edit.ts
│   │   │   │   ├── move.ts
│   │   │   │   ├── assign.ts
│   │   │   │   ├── clone.ts
│   │   │   │   ├── delete.ts
│   │   │   │   ├── link.ts
│   │   │   │   ├── comment.ts
│   │   │   │   └── worklog.ts
│   │   │   ├── epic/
│   │   │   │   ├── index.ts
│   │   │   │   ├── list.ts
│   │   │   │   ├── create.ts
│   │   │   │   ├── add.ts
│   │   │   │   └── remove.ts
│   │   │   ├── sprint/
│   │   │   │   ├── index.ts
│   │   │   │   ├── list.ts
│   │   │   │   ├── create.ts
│   │   │   │   └── add.ts
│   │   │   ├── project/
│   │   │   │   ├── index.ts
│   │   │   │   └── list.ts
│   │   │   ├── board/
│   │   │   │   ├── index.ts
│   │   │   │   └── list.ts
│   │   │   ├── release/
│   │   │   │   ├── index.ts
│   │   │   │   ├── list.ts
│   │   │   │   └── create.ts
│   │   │   ├── user/
│   │   │   │   ├── index.ts
│   │   │   │   └── search.ts
│   │   │   ├── init.ts         # Configuration wizard
│   │   │   ├── me.ts           # Current user info
│   │   │   ├── open.ts         # Open in browser
│   │   │   └── completion.ts   # Shell completion
│   │   └── middleware/
│   │       ├── auth.ts         # Authentication check
│   │       ├── config.ts       # Config loading
│   │       └── output.ts       # Output format handler
│   ├── api/
│   │   ├── client.ts           # HTTP client wrapper
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   ├── basic.ts
│   │   │   ├── bearer.ts       # PAT authentication
│   │   │   └── oauth.ts        # OAuth 2.0 (future)
│   │   ├── endpoints/
│   │   │   ├── issue.ts
│   │   │   ├── epic.ts
│   │   │   ├── sprint.ts
│   │   │   ├── project.ts
│   │   │   ├── board.ts
│   │   │   ├── release.ts
│   │   │   ├── user.ts
│   │   │   └── search.ts       # JQL search
│   │   └── types/
│   │       ├── issue.ts
│   │       ├── epic.ts
│   │       ├── sprint.ts
│   │       ├── project.ts
│   │       ├── board.ts
│   │       ├── release.ts
│   │       ├── user.ts
│   │       └── common.ts
│   ├── config/
│   │   ├── index.ts            # Config manager
│   │   ├── schema.ts           # Config schema/validation
│   │   └── paths.ts            # Config file paths
│   ├── output/
│   │   ├── index.ts            # Output manager
│   │   ├── formatters/
│   │   │   ├── table.ts        # Interactive table
│   │   │   ├── plain.ts        # Plain text
│   │   │   ├── json.ts         # JSON output
│   │   │   └── xml.ts          # XML output
│   │   └── renderers/
│   │       ├── issue.ts
│   │       ├── epic.ts
│   │       └── sprint.ts
│   ├── tui/
│   │   ├── index.ts            # TUI manager
│   │   ├── components/
│   │   │   ├── table.ts        # Interactive table
│   │   │   ├── explorer.ts     # Explorer view
│   │   │   └── viewer.ts       # Detail viewer
│   │   └── keybindings.ts      # Keyboard shortcuts
│   └── utils/
│       ├── jql.ts              # JQL builder
│       ├── date.ts             # Date parsing/formatting
│       ├── markdown.ts         # Markdown conversion
│       ├── clipboard.ts        # Clipboard operations
│       ├── browser.ts          # Open in browser
│       └── spinner.ts          # Loading spinner
├── tests/
│   ├── unit/
│   │   ├── api/
│   │   ├── cli/
│   │   └── utils/
│   ├── integration/
│   │   └── commands/
│   └── fixtures/
├── docs/
│   ├── commands.md
│   ├── configuration.md
│   └── contributing.md
├── package.json
├── tsconfig.json
├── bunfig.toml
├── .env.example
├── LICENSE
└── README.md
```

---

## 2. Core Commands Specification

### 2.1 Global Options

All commands support these global options:

```
--config, -c <path>     Config file path (default: ~/.config/scry/config.yml)
--project, -p <key>     Jira project key
--debug                 Enable debug output
--output, -o <format>   Output format: table|plain|json|xml (default: table)
--no-color              Disable colored output
--help, -h              Show help
--version, -v           Show version
```

### 2.2 Issue Commands

```bash
# List issues with filtering
scry issue list [OPTIONS]
  -a, --assignee <user>      Filter by assignee (use 'x' for unassigned)
  -r, --reporter <user>      Filter by reporter
  -s, --status <status>      Filter by status (prefix with ~ to exclude)
  -t, --type <type>          Filter by issue type
  -y, --priority <priority>  Filter by priority
  -l, --label <label>        Filter by label (repeatable)
  -C, --component <comp>     Filter by component
  -q, --jql <query>          Raw JQL query
  -w, --watching             Issues I'm watching
  --created <period>         Created time filter (e.g., -7d, week, month)
  --updated <period>         Updated time filter
  --order-by <field>         Sort field (default: created)
  --reverse                  Reverse sort order
  --plain                    Plain text output
  --raw                      Raw JSON output (alias for -o json)
  --csv                      CSV output
  --columns <cols>           Columns to display

# Create issue
scry issue create [OPTIONS]
  -t, --type <type>          Issue type (required)
  -s, --summary <text>       Summary (required)
  -b, --body <text>          Description body
  -y, --priority <priority>  Priority
  -a, --assignee <user>      Assignee
  -l, --label <label>        Labels (repeatable)
  -C, --component <comp>     Components (repeatable)
  -P, --parent <key>         Parent issue/epic
  --fix-version <version>    Fix version
  --template <path>          Load description from template
  --custom <field=value>     Custom field (repeatable)
  --no-input                 Skip interactive prompts

# View issue details
scry issue view <issue-key> [OPTIONS]
  --comments <n>             Show n recent comments

# Edit issue
scry issue edit <issue-key> [OPTIONS]
  -s, --summary <text>       New summary
  -b, --body <text>          New description
  -y, --priority <priority>  New priority
  -l, --label <label>        Add label (prefix with - to remove)
  -C, --component <comp>     Add component (prefix with - to remove)
  --fix-version <version>    Add fix version (prefix with - to remove)
  --no-input                 Skip interactive prompts

# Assign issue
scry issue assign [issue-key] [user]
  # user can be: username, 'default', 'x' (unassign), $(scry me)

# Move/transition issue
scry issue move [issue-key] [status] [OPTIONS]
  --comment <text>           Add comment during transition
  -R, --resolution <res>     Set resolution
  -a, --assignee <user>      Set assignee

# Clone issue
scry issue clone <issue-key> [OPTIONS]
  -s, --summary <text>       Modified summary
  -H, --replace <find:repl>  Replace text in summary/description

# Delete issue
scry issue delete <issue-key> [OPTIONS]
  --cascade                  Delete subtasks too

# Link issues
scry issue link [issue1] [issue2] [link-type]
scry issue link remote <issue-key> <url> [title]

# Unlink issues
scry issue unlink <issue1> <issue2>

# Comments
scry issue comment add <issue-key> [body] [OPTIONS]
  --template <path>          Load from template
  --internal                 Internal comment (Service Desk)

# Worklog
scry issue worklog add <issue-key> <time-spent> [OPTIONS]
  --comment <text>           Worklog comment
  --no-input                 Skip prompts
```

### 2.3 Epic Commands

```bash
# List epics or issues in an epic
scry epic list [epic-key] [OPTIONS]
  # Supports all issue list filters
  --table                    Table view instead of explorer

# Create epic
scry epic create [OPTIONS]
  -n, --name <name>          Epic name (required)
  -s, --summary <text>       Summary (required)
  # Supports other issue create options

# Add issues to epic
scry epic add <epic-key> <issue-key>...

# Remove issues from epic
scry epic remove <issue-key>...
```

### 2.4 Sprint Commands

```bash
# List sprints or issues in a sprint
scry sprint list [sprint-id] [OPTIONS]
  --current                  Current active sprint
  --prev                     Previous sprint
  --next                     Next planned sprint
  --state <states>           Filter by state (future,active,closed)
  --table                    Table view instead of explorer

# Create sprint
scry sprint create [OPTIONS]
  -n, --name <name>          Sprint name (required)
  --start <date>             Start date
  --end <date>               End date
  --goal <text>              Sprint goal

# Add issues to sprint
scry sprint add <sprint-id> <issue-key>...
```

### 2.5 Project Commands

```bash
# List projects
scry project list [OPTIONS]
  --type <type>              Filter by project type
```

### 2.6 Board Commands

```bash
# List boards
scry board list [OPTIONS]
  --type <type>              Filter: scrum|kanban
```

### 2.7 Release Commands

```bash
# List releases/versions
scry release list [OPTIONS]
  --project <key>            Project key

# Create release
scry release create <version> [OPTIONS]
  --description <text>       Version description
  --start <date>             Start date
  --release <date>           Release date
```

### 2.8 User Commands

```bash
# Search users
scry user search <query>

# Get current user
scry me
```

### 2.9 Utility Commands

```bash
# Initialize configuration
scry init

# Open issue/project in browser
scry open [issue-key]

# Shell completion
scry completion <shell>      # bash|zsh|fish
```

---

## 3. Output Formats for Coding Agents

### 3.1 JSON Output

All commands support `--output json` or `--raw` flag:

```bash
scry issue list -o json
```

```json
{
  "issues": [
    {
      "key": "PROJ-123",
      "summary": "Fix login bug",
      "status": "In Progress",
      "assignee": {
        "accountId": "abc123",
        "displayName": "John Doe",
        "emailAddress": "john@example.com"
      },
      "priority": "High",
      "type": "Bug",
      "labels": ["backend", "urgent"],
      "created": "2024-01-15T10:30:00.000Z",
      "updated": "2024-01-16T14:22:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "maxResults": 50,
    "startAt": 0
  }
}
```

### 3.2 XML Output

All commands support `--output xml` flag:

```bash
scry issue list -o xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <issues>
    <issue>
      <key>PROJ-123</key>
      <summary>Fix login bug</summary>
      <status>In Progress</status>
      <assignee>
        <accountId>abc123</accountId>
        <displayName>John Doe</displayName>
        <emailAddress>john@example.com</emailAddress>
      </assignee>
      <priority>High</priority>
      <type>Bug</type>
      <labels>
        <label>backend</label>
        <label>urgent</label>
      </labels>
      <created>2024-01-15T10:30:00.000Z</created>
      <updated>2024-01-16T14:22:00.000Z</updated>
    </issue>
  </issues>
  <meta>
    <total>1</total>
    <maxResults>50</maxResults>
    <startAt>0</startAt>
  </meta>
</response>
```

### 3.3 Output Wrapper Type Definition

```typescript
// src/output/types.ts
export interface OutputWrapper<T> {
  data: T;
  meta?: {
    total?: number;
    maxResults?: number;
    startAt?: number;
    nextPageToken?: string;
    isLast?: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type OutputFormat = 'table' | 'plain' | 'json' | 'xml' | 'csv';
```

---

## 4. API Client Design

### 4.1 HTTP Client

```typescript
// src/api/client.ts
import type { Config } from '../config';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export class JiraClient {
  private baseUrl: string;
  private auth: AuthProvider;
  
  constructor(config: Config) {
    this.baseUrl = config.server;
    this.auth = createAuthProvider(config);
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.auth.getHeaders(),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new JiraApiError(response.status, await response.json());
    }

    return response.json();
  }

  // Convenience methods
  get<T>(endpoint: string, params?: RequestOptions['params']): Promise<T> {
    return this.request<T>(endpoint, { params });
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
```

### 4.2 Endpoint Modules

```typescript
// src/api/endpoints/issue.ts
export class IssueEndpoint {
  constructor(private client: JiraClient) {}

  async search(jql: string, options?: SearchOptions): Promise<SearchResult> {
    return this.client.post('/rest/api/3/search/jql', {
      jql,
      maxResults: options?.maxResults ?? 50,
      fields: options?.fields ?? ['summary', 'status', 'assignee', 'priority', 'issuetype'],
      nextPageToken: options?.nextPageToken,
    });
  }

  async get(issueIdOrKey: string, options?: GetOptions): Promise<Issue> {
    return this.client.get(`/rest/api/3/issue/${issueIdOrKey}`, {
      fields: options?.fields?.join(','),
      expand: options?.expand?.join(','),
    });
  }

  async create(issue: CreateIssueRequest): Promise<CreatedIssue> {
    return this.client.post('/rest/api/3/issue', { fields: issue });
  }

  async update(issueIdOrKey: string, fields: Partial<IssueFields>): Promise<void> {
    return this.client.put(`/rest/api/3/issue/${issueIdOrKey}`, { fields });
  }

  async delete(issueIdOrKey: string, deleteSubtasks = false): Promise<void> {
    return this.client.delete(`/rest/api/3/issue/${issueIdOrKey}?deleteSubtasks=${deleteSubtasks}`);
  }

  async getTransitions(issueIdOrKey: string): Promise<Transition[]> {
    const result = await this.client.get<{ transitions: Transition[] }>(
      `/rest/api/3/issue/${issueIdOrKey}/transitions`
    );
    return result.transitions;
  }

  async transition(issueIdOrKey: string, transitionId: string, options?: TransitionOptions): Promise<void> {
    return this.client.post(`/rest/api/3/issue/${issueIdOrKey}/transitions`, {
      transition: { id: transitionId },
      fields: options?.fields,
      update: options?.update,
    });
  }

  async assign(issueIdOrKey: string, accountId: string | null): Promise<void> {
    return this.client.put(`/rest/api/3/issue/${issueIdOrKey}/assignee`, { accountId });
  }

  async addComment(issueIdOrKey: string, body: string, options?: CommentOptions): Promise<Comment> {
    return this.client.post(`/rest/api/3/issue/${issueIdOrKey}/comment`, {
      body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] },
      visibility: options?.visibility,
    });
  }

  async addWorklog(issueIdOrKey: string, timeSpent: string, options?: WorklogOptions): Promise<Worklog> {
    return this.client.post(`/rest/api/3/issue/${issueIdOrKey}/worklog`, {
      timeSpent,
      comment: options?.comment ? {
        type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: options.comment }] }]
      } : undefined,
      started: options?.started,
    });
  }

  async link(outwardIssue: string, inwardIssue: string, linkType: string): Promise<void> {
    return this.client.post('/rest/api/3/issueLink', {
      outwardIssue: { key: outwardIssue },
      inwardIssue: { key: inwardIssue },
      type: { name: linkType },
    });
  }

  async clone(issueIdOrKey: string, options?: CloneOptions): Promise<CreatedIssue> {
    const original = await this.get(issueIdOrKey);
    const cloneFields = {
      ...original.fields,
      summary: options?.summary ?? `Clone of ${original.fields.summary}`,
      // Remove fields that shouldn't be cloned
      attachment: undefined,
      comment: undefined,
      worklog: undefined,
    };
    return this.create(cloneFields);
  }
}
```

---

## 5. Configuration System

### 5.1 Config File Structure

```yaml
# ~/.config/scry/config.yml
server: https://your-domain.atlassian.net
login: your-email@example.com
project:
  key: PROJ
  type: classic  # or next-gen
board:
  id: 1
  type: scrum    # or kanban

# Authentication (token stored in env var or keychain)
auth:
  type: basic    # basic, bearer, or mtls

# Epic configuration (for classic projects)
epic:
  name: customfield_10011
  link: customfield_10014

# Issue type mappings
issue:
  types:
    - name: Story
      handle: Story
    - name: Bug
      handle: Bug
    - name: Task
      handle: Task
    - name: Epic
      handle: Epic
    - name: Sub-task
      handle: Sub-task

# Default output settings
output:
  format: table  # table, plain, json, xml
  colors: true
```

### 5.2 Environment Variables

```bash
# Required
SCRY_API_TOKEN=your-api-token

# Optional overrides
SCRY_SERVER=https://your-domain.atlassian.net
SCRY_PROJECT=PROJ
SCRY_AUTH_TYPE=basic  # basic, bearer
SCRY_CONFIG_FILE=/path/to/config.yml
```

### 5.3 Config Manager

```typescript
// src/config/index.ts
import { parse } from 'yaml';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Config, ConfigSchema } from './schema';

const DEFAULT_CONFIG_PATHS = [
  process.env.SCRY_CONFIG_FILE,
  join(process.cwd(), '.scry.yml'),
  join(homedir(), '.config', 'scry', 'config.yml'),
  join(homedir(), '.scry.yml'),
].filter(Boolean) as string[];

export class ConfigManager {
  private config: Config | null = null;
  private configPath: string | null = null;

  load(customPath?: string): Config {
    const paths = customPath ? [customPath] : DEFAULT_CONFIG_PATHS;
    
    for (const path of paths) {
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');
        const parsed = parse(content) as ConfigSchema;
        this.config = this.mergeWithEnv(parsed);
        this.configPath = path;
        return this.config;
      }
    }

    throw new Error('No configuration file found. Run "scry init" to create one.');
  }

  private mergeWithEnv(config: ConfigSchema): Config {
    return {
      ...config,
      server: process.env.SCRY_SERVER || config.server,
      login: process.env.SCRY_LOGIN || config.login,
      project: {
        ...config.project,
        key: process.env.SCRY_PROJECT || config.project?.key,
      },
      auth: {
        ...config.auth,
        type: (process.env.SCRY_AUTH_TYPE as 'basic' | 'bearer') || config.auth?.type || 'basic',
        token: process.env.SCRY_API_TOKEN,
      },
    };
  }

  getConfigPath(): string | null {
    return this.configPath;
  }
}
```

---

## 6. Build and Distribution

### 6.1 Bun Build Configuration

```toml
# bunfig.toml
[build]
target = "bun"
minify = true
sourcemap = "external"
```

### 6.2 Build Script

```typescript
// scripts/build.ts
import { $ } from 'bun';

const VERSION = process.env.VERSION || '0.0.0';
const BUILD_TIME = new Date().toISOString();

const targets = [
  { name: 'linux-x64', target: 'bun-linux-x64' },
  { name: 'linux-arm64', target: 'bun-linux-arm64' },
  { name: 'darwin-x64', target: 'bun-darwin-x64' },
  { name: 'darwin-arm64', target: 'bun-darwin-arm64' },
  { name: 'windows-x64', target: 'bun-windows-x64', ext: '.exe' },
];

for (const { name, target, ext = '' } of targets) {
  console.log(`Building for ${name}...`);
  
  await $`bun build --compile \
    --target=${target} \
    --define BUILD_VERSION='"${VERSION}"' \
    --define BUILD_TIME='"${BUILD_TIME}"' \
    --outfile dist/scry-${name}${ext} \
    src/index.ts`;
}

console.log('Build complete!');
```

### 6.3 Package.json

```json
{
  "name": "scry",
  "version": "0.1.0",
  "description": "Feature-rich interactive Jira command line",
  "type": "module",
  "main": "src/index.ts",
  "bin": {
    "scry": "src/index.ts"
  },
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun run scripts/build.ts",
    "build:local": "bun build --compile --outfile dist/scry src/index.ts",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write src tests",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "@inquirer/prompts": "^5.0.0",
    "chalk": "^5.3.0",
    "cli-table3": "^0.6.4",
    "fast-xml-parser": "^4.3.0",
    "yaml": "^2.4.0",
    "ora": "^8.0.0",
    "marked": "^12.0.0",
    "marked-terminal": "^7.0.0",
    "open": "^10.0.0",
    "clipboardy": "^4.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.4.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  },
  "engines": {
    "bun": ">=1.1.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/scry.git"
  },
  "keywords": [
    "jira",
    "cli",
    "command-line",
    "atlassian",
    "agile",
    "typescript",
    "bun"
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

---

## 7. GitHub Actions Workflows

### 7.1 CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun test --coverage

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun run build:local
      - name: Test binary
        run: ./dist/scry --version
```

### 7.2 Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            targets: linux-x64,linux-arm64
          - os: macos-latest
            targets: darwin-x64,darwin-arm64
          - os: windows-latest
            targets: windows-x64

    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - run: bun install

      - name: Build binaries
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          for target in $(echo "${{ matrix.targets }}" | tr ',' ' '); do
            echo "Building for $target..."
            if [[ "$target" == *"windows"* ]]; then
              bun build --compile --target=bun-$target --outfile dist/scry-$target.exe src/index.ts
            else
              bun build --compile --target=bun-$target --outfile dist/scry-$target src/index.ts
            fi
          done
        shell: bash
        env:
          VERSION: ${{ github.ref_name }}

      - name: Create archives
        run: |
          cd dist
          for file in scry-*; do
            if [[ "$file" == *.exe ]]; then
              zip "${file%.exe}.zip" "$file"
            else
              tar -czvf "$file.tar.gz" "$file"
            fi
          done
        shell: bash

      - uses: actions/upload-artifact@v4
        with:
          name: binaries-${{ matrix.os }}
          path: dist/*.tar.gz
          if-no-files-found: ignore

      - uses: actions/upload-artifact@v4
        with:
          name: binaries-${{ matrix.os }}-windows
          path: dist/*.zip
          if-no-files-found: ignore

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/download-artifact@v4
        with:
          path: artifacts
          merge-multiple: true

      - name: Generate checksums
        run: |
          cd artifacts
          sha256sum * > checksums.txt

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            artifacts/*
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, 'alpha') || contains(github.ref, 'beta') || contains(github.ref, 'rc') }}
```

---

## 8. Development Phases

### Phase 1: Foundation (Weeks 1-2)

**Goals:** Project setup, core infrastructure, basic commands

**Tasks:**
- [ ] Initialize Bun project with TypeScript
- [ ] Set up ESLint, Prettier, and TypeScript config
- [ ] Implement configuration system (load, validate, save)
- [ ] Build HTTP client with authentication (basic, bearer)
- [ ] Create output formatting system (table, plain, JSON, XML)
- [ ] Implement `scry init` command
- [ ] Implement `scry me` command
- [ ] Set up GitHub repository with CI workflow

**Deliverables:**
- Working project scaffold
- Config management
- API client with auth
- Two working commands

### Phase 2: Core Issue Commands (Weeks 3-4)

**Goals:** Full issue management functionality

**Tasks:**
- [ ] Implement `scry issue list` with all filters
- [ ] Implement `scry issue create` with interactive prompts
- [ ] Implement `scry issue view` with markdown rendering
- [ ] Implement `scry issue edit`
- [ ] Implement `scry issue move` (transitions)
- [ ] Implement `scry issue assign`
- [ ] Implement `scry issue delete`
- [ ] Implement `scry issue clone`
- [ ] Implement `scry issue link` and `unlink`
- [ ] Implement `scry issue comment add`
- [ ] Implement `scry issue worklog add`
- [ ] Build JQL builder utility

**Deliverables:**
- Complete issue command suite
- Interactive prompts
- JQL filtering

### Phase 3: Epic and Sprint Commands (Weeks 5-6)

**Goals:** Agile workflow support

**Tasks:**
- [ ] Implement `scry epic list` with explorer view
- [ ] Implement `scry epic create`
- [ ] Implement `scry epic add` / `remove`
- [ ] Implement `scry sprint list` with explorer view
- [ ] Implement `scry sprint create`
- [ ] Implement `scry sprint add`
- [ ] Build explorer TUI component

**Deliverables:**
- Complete epic commands
- Complete sprint commands
- Explorer view for browsing

### Phase 4: Supporting Commands (Week 7)

**Goals:** Project, board, release, user commands

**Tasks:**
- [ ] Implement `scry project list`
- [ ] Implement `scry board list`
- [ ] Implement `scry release list` / `create`
- [ ] Implement `scry user search`
- [ ] Implement `scry open`
- [ ] Implement `scry completion`

**Deliverables:**
- All supporting commands
- Shell completion scripts
- Browser integration

### Phase 5: Polish and Release (Week 8)

**Goals:** Testing, documentation, release

**Tasks:**
- [ ] Write comprehensive unit tests
- [ ] Write integration tests
- [ ] Create user documentation
- [ ] Set up release workflow
- [ ] Build and test cross-platform binaries
- [ ] Create README with examples
- [ ] Publish initial release

**Deliverables:**
- 80%+ test coverage
- Complete documentation
- Cross-platform binaries
- v0.1.0 release

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// tests/unit/utils/jql.test.ts
import { describe, expect, test } from 'bun:test';
import { JqlBuilder } from '../../../src/utils/jql';

describe('JqlBuilder', () => {
  test('builds simple equality condition', () => {
    const jql = new JqlBuilder()
      .project('PROJ')
      .build();
    expect(jql).toBe('project = "PROJ"');
  });

  test('builds complex query with multiple conditions', () => {
    const jql = new JqlBuilder()
      .project('PROJ')
      .assignee('john.doe')
      .status('In Progress')
      .priority('High')
      .orderBy('created', 'DESC')
      .build();
    
    expect(jql).toBe(
      'project = "PROJ" AND assignee = "john.doe" AND status = "In Progress" AND priority = "High" ORDER BY created DESC'
    );
  });

  test('handles negation with tilde prefix', () => {
    const jql = new JqlBuilder()
      .project('PROJ')
      .status('~Done')
      .build();
    expect(jql).toBe('project = "PROJ" AND status != "Done"');
  });

  test('handles unassigned with x', () => {
    const jql = new JqlBuilder()
      .project('PROJ')
      .assignee('x')
      .build();
    expect(jql).toBe('project = "PROJ" AND assignee IS EMPTY');
  });
});
```

### 9.2 Integration Tests

```typescript
// tests/integration/commands/issue-list.test.ts
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { $ } from 'bun';

describe('scry issue list', () => {
  test('outputs valid JSON with --output json', async () => {
    const result = await $`./dist/scry issue list --output json`.text();
    const parsed = JSON.parse(result);
    
    expect(parsed).toHaveProperty('issues');
    expect(parsed).toHaveProperty('meta');
    expect(Array.isArray(parsed.issues)).toBe(true);
  });

  test('outputs valid XML with --output xml', async () => {
    const result = await $`./dist/scry issue list --output xml`.text();
    
    expect(result).toContain('<?xml version="1.0"');
    expect(result).toContain('<response>');
    expect(result).toContain('<issues>');
  });

  test('filters by assignee', async () => {
    const result = await $`./dist/scry issue list -a john.doe --output json`.text();
    const parsed = JSON.parse(result);
    
    for (const issue of parsed.issues) {
      expect(issue.assignee?.displayName).toContain('john');
    }
  });
});
```

### 9.3 Mock Server

```typescript
// tests/fixtures/mock-server.ts
import { serve } from 'bun';

const mockIssues = [
  {
    key: 'TEST-1',
    fields: {
      summary: 'Test issue 1',
      status: { name: 'To Do' },
      assignee: { displayName: 'John Doe', accountId: 'abc123' },
      priority: { name: 'High' },
      issuetype: { name: 'Bug' },
    },
  },
];

export function startMockServer(port = 3000) {
  return serve({
    port,
    fetch(req) {
      const url = new URL(req.url);
      
      if (url.pathname === '/rest/api/3/search/jql') {
        return Response.json({
          issues: mockIssues,
          maxResults: 50,
          startAt: 0,
          isLast: true,
        });
      }
      
      if (url.pathname.match(/\/rest\/api\/3\/issue\/\w+-\d+/)) {
        return Response.json(mockIssues[0]);
      }
      
      return new Response('Not Found', { status: 404 });
    },
  });
}
```

---

## 10. Type Definitions

### 10.1 Core Jira Types

```typescript
// src/api/types/issue.ts
export interface Issue {
  id: string;
  key: string;
  self: string;
  fields: IssueFields;
}

export interface IssueFields {
  summary: string;
  description?: AtlassianDocument;
  status: Status;
  assignee?: User;
  reporter?: User;
  priority?: Priority;
  issuetype: IssueType;
  project: Project;
  labels?: string[];
  components?: Component[];
  fixVersions?: Version[];
  created: string;
  updated: string;
  resolution?: Resolution;
  parent?: ParentIssue;
  subtasks?: Issue[];
  comment?: {
    comments: Comment[];
    total: number;
  };
  worklog?: {
    worklogs: Worklog[];
    total: number;
  };
  [key: string]: unknown; // Custom fields
}

export interface Status {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName: string;
  };
}

export interface User {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
  active: boolean;
}

export interface Priority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface IssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
}

export interface Version {
  id: string;
  name: string;
  description?: string;
  released: boolean;
  releaseDate?: string;
}

export interface Resolution {
  id: string;
  name: string;
  description?: string;
}

export interface Comment {
  id: string;
  author: User;
  body: AtlassianDocument;
  created: string;
  updated: string;
}

export interface Worklog {
  id: string;
  author: User;
  comment?: AtlassianDocument;
  timeSpent: string;
  timeSpentSeconds: number;
  started: string;
}

export interface Transition {
  id: string;
  name: string;
  to: Status;
  hasScreen: boolean;
  isAvailable: boolean;
}

export interface SearchResult {
  issues: Issue[];
  maxResults: number;
  startAt: number;
  total?: number;
  isLast?: boolean;
  nextPageToken?: string;
}
```

### 10.2 Atlassian Document Format

```typescript
// src/api/types/common.ts
export interface AtlassianDocument {
  type: 'doc';
  version: 1;
  content: AtlassianNode[];
}

export type AtlassianNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | CodeBlockNode
  | BlockquoteNode
  | RuleNode
  | TableNode
  | MediaNode;

export interface ParagraphNode {
  type: 'paragraph';
  content?: InlineNode[];
}

export interface HeadingNode {
  type: 'heading';
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: InlineNode[];
}

export interface TextNode {
  type: 'text';
  text: string;
  marks?: Mark[];
}

export interface Mark {
  type: 'strong' | 'em' | 'code' | 'link' | 'strike' | 'underline';
  attrs?: Record<string, unknown>;
}

// ... additional node types
```

---

## 11. Error Handling

### 11.1 Custom Error Classes

```typescript
// src/errors.ts
export class ScryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ScryError';
  }
}

export class ConfigError extends ScryError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

export class AuthError extends ScryError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'AuthError';
  }
}

export class JiraApiError extends ScryError {
  constructor(
    public statusCode: number,
    public response: JiraErrorResponse
  ) {
    const message = response.errorMessages?.join(', ') 
      || response.errors 
      ? Object.values(response.errors).join(', ')
      : `HTTP ${statusCode}`;
    
    super(message, 'JIRA_API_ERROR', response);
    this.name = 'JiraApiError';
  }
}

export interface JiraErrorResponse {
  errorMessages?: string[];
  errors?: Record<string, string>;
}
```

### 11.2 Global Error Handler

```typescript
// src/cli/error-handler.ts
import chalk from 'chalk';
import type { OutputFormat } from '../output';

export function handleError(error: unknown, format: OutputFormat = 'table'): never {
  if (format === 'json') {
    console.error(JSON.stringify({
      error: {
        code: error instanceof ScryError ? error.code : 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof ScryError ? error.details : undefined,
      },
    }));
  } else if (format === 'xml') {
    console.error(`<?xml version="1.0" encoding="UTF-8"?>
<error>
  <code>${error instanceof ScryError ? error.code : 'UNKNOWN_ERROR'}</code>
  <message>${error instanceof Error ? escapeXml(error.message) : escapeXml(String(error))}</message>
</error>`);
  } else {
    if (error instanceof AuthError) {
      console.error(chalk.red('Authentication failed:'), error.message);
      console.error(chalk.dim('Check your SCRY_API_TOKEN environment variable.'));
    } else if (error instanceof ConfigError) {
      console.error(chalk.red('Configuration error:'), error.message);
      console.error(chalk.dim('Run "scry init" to create a configuration file.'));
    } else if (error instanceof JiraApiError) {
      console.error(chalk.red(`Jira API error (${error.statusCode}):`), error.message);
    } else if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
  }
  
  process.exit(1);
}
```

---

## 12. Future Enhancements

### 12.1 Version 1.x Roadmap

- **OAuth 2.0 authentication** - Support for OAuth flow for enhanced security
- **mTLS support** - Client certificate authentication for on-premise
- **Batch operations** - Create/update multiple issues at once
- **Saved queries** - Save and recall frequently used JQL queries
- **Templates** - Issue and description templates
- **Plugins** - Extension system for custom commands
- **Webhooks** - Listen for Jira events
- **Caching** - Local cache for faster repeated queries

### 12.2 Potential Integrations

- **Git integration** - Create branches, link commits to issues
- **CI/CD integration** - Transition issues on deployment
- **Slack/Discord** - Notifications and commands
- **VS Code extension** - Issue management from IDE

---

## Appendix A: Jira REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/api/3/search/jql` | POST | Search issues using JQL |
| `/rest/api/3/issue` | POST | Create issue |
| `/rest/api/3/issue/{issueIdOrKey}` | GET | Get issue |
| `/rest/api/3/issue/{issueIdOrKey}` | PUT | Update issue |
| `/rest/api/3/issue/{issueIdOrKey}` | DELETE | Delete issue |
| `/rest/api/3/issue/{issueIdOrKey}/transitions` | GET | Get transitions |
| `/rest/api/3/issue/{issueIdOrKey}/transitions` | POST | Transition issue |
| `/rest/api/3/issue/{issueIdOrKey}/assignee` | PUT | Assign issue |
| `/rest/api/3/issue/{issueIdOrKey}/comment` | POST | Add comment |
| `/rest/api/3/issue/{issueIdOrKey}/worklog` | POST | Add worklog |
| `/rest/api/3/issueLink` | POST | Link issues |
| `/rest/api/3/project` | GET | List projects |
| `/rest/agile/1.0/board` | GET | List boards |
| `/rest/agile/1.0/board/{boardId}/sprint` | GET | List sprints |
| `/rest/agile/1.0/sprint/{sprintId}/issue` | GET | Get sprint issues |
| `/rest/agile/1.0/sprint/{sprintId}/issue` | POST | Add issues to sprint |
| `/rest/api/3/project/{projectIdOrKey}/versions` | GET | List versions |
| `/rest/api/3/version` | POST | Create version |
| `/rest/api/3/user/search` | GET | Search users |
| `/rest/api/3/myself` | GET | Get current user |

---

## Appendix B: Quick Start Commands

```bash
# Initialize (first time)
scry init

# List recent issues
scry issue list

# Create a bug
scry issue create -t Bug -s "Login fails on mobile" -y High

# Assign to yourself
scry issue assign PROJ-123 $(scry me)

# Move to In Progress
scry issue move PROJ-123 "In Progress"

# Add a comment
scry issue comment add PROJ-123 "Working on this now"

# View issue details
scry issue view PROJ-123

# List sprint issues (JSON for AI agent)
scry sprint list --current -o json

# Search with JQL
scry issue list -q "labels = urgent AND status != Done"
```

---

*Document Version: 1.0*  
*Last Updated: December 2024*
