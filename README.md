# Scry

> A feature-rich, interactive Jira command-line interface built with TypeScript and Bun.

Scry is a powerful CLI tool for managing Jira from your terminal. Inspired by [ankitpokhrel/jira-cli](https://github.com/ankitpokhrel/jira-cli), it provides comprehensive support for Issues, Epics, Sprints, Projects, Boards, Releases, and Users, with multiple output formats including JSON and XML for seamless AI agent and scripting integration.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with Bun](https://img.shields.io/badge/built%20with-Bun-orange)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

## Features

- **Full Jira Object Support**: Issues, Epics, Sprints, Projects, Boards, Releases, Users
- **Interactive & Scriptable**: Rich terminal UI with prompts, plus non-interactive mode for automation
- **Multiple Output Formats**: `table`, `plain`, `json`, `xml`, `csv` - perfect for scripts and AI agents
- **Powerful Filtering**: JQL support, assignee/status/label filters, date ranges, custom queries
- **Workflow Management**: Create, edit, move, assign, comment, clone, and delete issues
- **Fast & Modern**: Built with Bun for blazing-fast startup and execution
- **Simple Configuration**: YAML config file + environment variables

## Installation

### Using Bun (Recommended)

```bash
bun install -g scry
```

### Using npm

```bash
npm install -g scry
```

### From Binary

Download the latest release for your platform from the [releases page](https://github.com/sarlalian/scry/releases):

```bash
# macOS/Linux
curl -L https://github.com/sarlalian/scry/releases/latest/download/scry-[platform] -o scry
chmod +x scry
sudo mv scry /usr/local/bin/
```

### From Source

```bash
git clone https://github.com/sarlalian/scry.git
cd scry
bun install
bun run build:local
# Binary will be in dist/scry
```

## Quick Start

### 1. Initialize Configuration

```bash
scry init
```

This will guide you through setting up your Jira connection:
- Jira server URL (e.g., `https://your-domain.atlassian.net`)
- Email address
- Authentication type (Basic or Bearer)
- Default project (optional)

### 2. Set API Token

Generate an API token at [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens), then:

```bash
export SCRY_API_TOKEN=your-token-here
```

Add this to your `~/.bashrc`, `~/.zshrc`, or equivalent for persistence.

### 3. Verify Connection

```bash
scry me
```

You should see your Jira user information!

## Configuration

### Config File

Scry searches for configuration in the following order:
1. Path specified by `SCRY_CONFIG_FILE` environment variable
2. `.scry.yml` in current directory
3. `~/.config/scry/config.yml` (default)
4. `~/.scry.yml`

Example `~/.config/scry/config.yml`:

```yaml
server: https://your-domain.atlassian.net
login: your-email@example.com
auth:
  type: basic  # or 'bearer'
project:
  key: PROJ
  type: classic  # or 'next-gen'
board:
  id: 123
  type: scrum  # or 'kanban'
output:
  format: table  # table|plain|json|xml|csv
  colors: true
issue:
  types:
    - name: Story
      handle: Story
    - name: Bug
      handle: Bug
    - name: Task
      handle: Task
```

### Environment Variables

Override config values with environment variables:

```bash
export SCRY_API_TOKEN=your-token           # Required
export SCRY_SERVER=https://domain.atlassian.net
export SCRY_LOGIN=email@example.com
export SCRY_PROJECT=PROJ
export SCRY_AUTH_TYPE=basic                # basic or bearer
export SCRY_CONFIG_FILE=/path/to/config.yml
```

### Global Options

All commands support these global options:

```bash
-c, --config <path>      # Custom config file path
-p, --project <key>      # Override project key
-o, --output <format>    # Output format: table|plain|json|xml|csv
--no-color              # Disable colored output
--debug                 # Enable debug logging
```

## Commands

### Issue Management

#### List Issues

```bash
# List all issues in default project
scry issue list

# Filter by assignee
scry issue list -a john.doe@example.com
scry issue list -a x  # Unassigned issues

# Filter by status
scry issue list -s "In Progress"
scry issue list -s "~Done"  # Exclude Done status

# Filter by type, priority, labels
scry issue list -t Bug -y High -l urgent -l security

# Date filters
scry issue list --created -7d     # Created in last 7 days
scry issue list --updated week    # Updated this week
scry issue list --created month   # Created this month

# Raw JQL query
scry issue list -q "assignee = currentUser() AND sprint in openSprints()"

# Watching issues
scry issue list -w

# Sort and limit
scry issue list --order-by updated --reverse --limit 10

# Custom columns
scry issue list --columns key,summary,status,assignee

# JSON output for scripting
scry issue list -o json --limit 50
```

#### View Issue

```bash
# View issue details
scry issue view PROJ-123

# Different output formats
scry issue view PROJ-123 -o json
scry issue view PROJ-123 -o xml
```

#### Create Issue

```bash
# Interactive mode (prompts for all fields)
scry issue create

# With flags (still prompts for missing required fields)
scry issue create -p PROJ -t Story -s "Add user authentication"

# Fully non-interactive
scry issue create \
  -p PROJ \
  -t Task \
  -s "Implement feature X" \
  -d "Detailed description here" \
  -a user@example.com \
  -y High \
  -l backend -l api

# Create subtask
scry issue create -p PROJ -t Sub-task -P PROJ-123 -s "Subtask title"

# Force interactive even with flags
scry issue create -t Story -i
```

#### Edit Issue

```bash
# Interactive mode
scry issue edit PROJ-123

# Update specific fields
scry issue edit PROJ-123 -s "Updated summary"
scry issue edit PROJ-123 -d "New description" -y Medium
scry issue edit PROJ-123 -l new-label -C ComponentName
```

#### Move Issue (Transitions)

```bash
# Interactive mode (shows available transitions)
scry issue move PROJ-123

# Direct transition
scry issue move PROJ-123 "In Progress"
scry issue move PROJ-123 Done
```

#### Assign Issue

```bash
# Assign to user
scry issue assign PROJ-123 john.doe@example.com

# Unassign
scry issue assign PROJ-123 x
```

#### Comment on Issue

```bash
# Add comment interactively
scry issue comment add PROJ-123

# Add comment directly
scry issue comment add PROJ-123 "This is a comment"

# Use editor for longer comments
scry issue comment add PROJ-123 -e

# From flag
scry issue comment add PROJ-123 -b "Comment text here"
```

#### Clone Issue

```bash
# Clone issue interactively
scry issue clone PROJ-123

# Clone with new summary
scry issue clone PROJ-123 -s "Cloned: Original Title"

# Clone to different project
scry issue clone PROJ-123 -p NEWPROJ
```

#### Delete Issue

```bash
# Delete single issue
scry issue delete PROJ-123

# Delete multiple issues
scry issue delete PROJ-123 PROJ-124 PROJ-125

# Skip confirmation
scry issue delete PROJ-123 -y
```

### Epic Management

#### List Epics

```bash
# List all epics in default project
scry epic list

# Filter and format
scry epic list -p PROJ -o json
```

#### Create Epic

```bash
# Interactive mode
scry epic create

# With flags
scry epic create -p PROJ -s "Epic Name" -d "Epic description"
```

#### Add Issues to Epic

```bash
scry epic add EPIC-1 PROJ-123 PROJ-124 PROJ-125
```

#### Remove Issues from Epic

```bash
scry epic remove EPIC-1 PROJ-123 PROJ-124
```

### Sprint Management

#### List Sprints

```bash
# List sprints from default board
scry sprint list

# List from specific board
scry sprint list -b 123

# Filter by state
scry sprint list --state active
scry sprint list --state future
scry sprint list --state closed
```

#### Create Sprint

```bash
# Interactive mode
scry sprint create

# With flags
scry sprint create -b 123 -n "Sprint 42" -g "Sprint 42 Goals"
```

#### Add Issues to Sprint

```bash
scry sprint add 456 PROJ-123 PROJ-124 PROJ-125
```

### Project Management

```bash
# List all projects
scry project list

# JSON output
scry project list -o json
```

### Board Management

```bash
# List all boards
scry board list

# Filter by type
scry board list -t scrum
scry board list -t kanban

# JSON output
scry board list -o json
```

### Release/Version Management

```bash
# List releases for default project
scry release list

# List for specific project
scry release list PROJ

# Create release
scry release create

# With flags
scry release create -p PROJ -n "v1.0.0" -d "Release description"
```

### User Management

```bash
# Search for users
scry user search john

# Limit results
scry user search john --limit 10

# JSON output
scry user search john -o json
```

### Utility Commands

#### Get Current User

```bash
scry me
```

#### Open in Browser

```bash
# Open issue in browser
scry open PROJ-123

# Open project
scry open PROJ

# Open board
scry open -b 123

# Open sprint in board
scry open -b 123 -s 456
```

## Output Formats

All commands support the `-o, --output` flag with the following formats:

### Table (Default)

Rich, colored terminal output with tables:

```bash
scry issue list
```

### Plain

Simple text output without colors:

```bash
scry issue list -o plain
```

### JSON

Structured JSON for scripting and AI agents:

```bash
scry issue list -o json
```

JSON output structure:

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "maxResults": 50,
    "startAt": 0
  }
}
```

### XML

XML format for legacy integrations:

```bash
scry issue list -o xml
```

### CSV

Comma-separated values for spreadsheets:

```bash
scry issue list -o csv > issues.csv
```

## Advanced Usage

### JQL Queries

Use raw JQL for complex queries:

```bash
# Find my open bugs
scry issue list -q "assignee = currentUser() AND type = Bug AND status != Done"

# Issues updated in last 2 weeks
scry issue list -q "updated >= -2w ORDER BY updated DESC"

# Complex sprint query
scry issue list -q "project = PROJ AND sprint in openSprints() AND status = 'In Progress'"
```

### Scripting with JSON Output

```bash
#!/bin/bash

# Get all open issues and extract keys
issues=$(scry issue list -s "~Done" -o json | jq -r '.data[].key')

# Process each issue
for issue in $issues; do
  echo "Processing $issue"
  # Do something with each issue
done
```

### CI/CD Integration

```yaml
# GitHub Actions example
name: Check Jira Issues
on: [push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install Scry
        run: bun install -g scry

      - name: Check Issues
        env:
          SCRY_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          SCRY_SERVER: https://your-domain.atlassian.net
          SCRY_LOGIN: bot@example.com
        run: |
          scry issue list -o json > issues.json
          # Process issues.json
```

### AI Agent Integration

Scry's JSON/XML output makes it perfect for AI coding agents:

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getJiraIssues() {
  const { stdout } = await execAsync('scry issue list -o json --limit 100');
  const result = JSON.parse(stdout);
  return result.data;
}

async function createIssueFromAI(summary, description) {
  await execAsync(
    `scry issue create -p PROJ -t Task -s "${summary}" -d "${description}"`
  );
}
```

### Multiple Jira Instances

Use different config files for different instances:

```bash
# Work Jira
export SCRY_CONFIG_FILE=~/.config/scry/work.yml
scry issue list

# Personal Jira
export SCRY_CONFIG_FILE=~/.config/scry/personal.yml
scry issue list
```

Or use command-line config override:

```bash
scry -c ~/.config/scry/work.yml issue list
scry -c ~/.config/scry/personal.yml me
```

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0

### Setup

```bash
git clone https://github.com/sarlalian/scry.git
cd scry
bun install
```

### Development Commands

```bash
bun run dev                # Run in development mode
bun run src/index.ts       # Run CLI directly
bun --hot src/index.ts     # Hot reload during development
bun test                   # Run tests
bun test --watch           # Watch mode
bun test --coverage        # With coverage
bun run lint               # Lint code
bun run typecheck          # Type checking
bun run build:local        # Build local binary
bun run build              # Build all platform binaries
```

### Project Structure

```
scry/
├── src/
│   ├── index.ts           # Entry point
│   ├── cli/               # CLI commands and middleware
│   │   ├── commands/      # Command implementations
│   │   └── middleware/    # Auth, config, output handlers
│   ├── api/               # Jira API client
│   │   ├── client.ts      # HTTP client
│   │   ├── auth/          # Authentication providers
│   │   ├── endpoints/     # API endpoint modules
│   │   └── types/         # TypeScript types
│   ├── config/            # Configuration management
│   ├── output/            # Output formatters
│   ├── tui/               # Terminal UI components
│   └── utils/             # Utilities
├── tests/                 # Test files
└── docs/                  # Documentation
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new features
3. **Follow the code style** (enforced by ESLint)
4. **Update documentation** for user-facing changes
5. **Test thoroughly** with `bun test`
6. **Submit a pull request** with a clear description

### Development Guidelines

- Use TypeScript for all new code
- Prefer Bun APIs over Node.js equivalents where possible
- Write unit tests for new functionality
- Follow existing patterns for commands and output formatting
- Keep commits atomic and well-described

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Language | TypeScript 5.x |
| CLI Framework | Commander.js |
| Prompts | @inquirer/prompts |
| HTTP Client | Native fetch |
| Configuration | YAML |
| Output | chalk, cli-table3, fast-xml-parser |
| Testing | Bun test |
| Build | Bun compile |

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [ankitpokhrel/jira-cli](https://github.com/ankitpokhrel/jira-cli)
- Built with [Bun](https://bun.sh) - a fast all-in-one JavaScript runtime
- Uses the [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

## Support

- **Issues**: [GitHub Issues](https://github.com/sarlalian/scry/issues)
- **Documentation**: This README and `CLAUDE.md`
- **Discussions**: [GitHub Discussions](https://github.com/sarlalian/scry/discussions)

---

**Made with TypeScript and Bun**
