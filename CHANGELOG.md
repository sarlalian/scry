# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

## [0.1.0] - 2025-12-11

### Added

#### Issue Management
- `issue list` - List and filter issues with support for:
  - Assignee filtering (including unassigned with `-a x`)
  - Status filtering (including exclusion with `~` prefix)
  - Type, priority, and label filtering
  - Date range filters (created, updated) with relative dates (-7d, week, month)
  - Raw JQL query support
  - Watching issues filter
  - Custom sorting and result limits
  - Custom column selection
- `issue view` - View detailed issue information
- `issue create` - Create new issues with interactive and non-interactive modes
  - Support for all issue types including subtasks
  - Configurable fields (summary, description, assignee, priority, labels, components)
  - Interactive prompts for required fields
- `issue edit` - Update existing issues
  - Modify summary, description, priority, labels, components
  - Interactive and flag-based modes
- `issue move` - Transition issues through workflow states
  - Interactive transition selection
  - Direct transition by name
- `issue assign` - Assign issues to users or unassign
- `issue comment add` - Add comments to issues
  - Interactive input
  - Direct text input
  - Editor mode for longer comments
- `issue clone` - Clone issues with customizable fields
  - Clone within project or across projects
  - Customize summary and other fields
- `issue delete` - Delete single or multiple issues
  - Batch deletion support
  - Confirmation prompts (skippable with `-y`)
- `issue link` - Create links between issues
- `issue unlink` - Remove links between issues
- `issue worklog` - Manage time tracking worklogs

#### Epic Management
- `epic list` - List epics in project
- `epic create` - Create new epics
- `epic add` - Add issues to epics (batch support)
- `epic remove` - Remove issues from epics (batch support)

#### Sprint Management
- `sprint list` - List sprints from boards
  - Filter by state (active, future, closed)
  - Board-specific listing
- `sprint create` - Create new sprints
- `sprint add` - Add issues to sprints (batch support)

#### Project Management
- `project list` - List all accessible projects
  - View project keys, names, types, and leads

#### Board Management
- `board list` - List all boards
  - Filter by board type (scrum, kanban)
  - View board IDs and configurations

#### Release/Version Management
- `release list` - List versions/releases for projects
- `release create` - Create new releases/versions

#### User Management
- `user search` - Search for users by name or email
  - Configurable result limits
  - View user details (name, email, account ID)

#### Utility Commands
- `me` - Display current authenticated user information
- `open` - Open Jira resources in browser
  - Open issues by key
  - Open projects
  - Open boards
  - Open sprints within boards
- `init` - Interactive setup wizard for initial configuration
  - Guides through server URL, authentication, and defaults setup
- `completion` - Generate shell completion scripts for bash, zsh, fish

#### Output Formats
- Table format (default) - Rich colored terminal tables
- Plain format - Simple text output without colors
- JSON format - Structured JSON with consistent wrapper
  - Includes data payload and metadata (total, pagination)
  - Error handling with structured error objects
- XML format - XML output for legacy integrations
- CSV format - Comma-separated values for spreadsheets

#### Configuration
- YAML-based configuration file system
  - Multiple config file locations supported
  - Precedence: environment variable > current directory > user config > home directory
- Environment variable support for all config values
  - `SCRY_API_TOKEN` - Jira API token (required)
  - `SCRY_SERVER` - Jira server URL
  - `SCRY_LOGIN` - User email
  - `SCRY_PROJECT` - Default project key
  - `SCRY_AUTH_TYPE` - Authentication type (basic, bearer)
  - `SCRY_CONFIG_FILE` - Custom config file path
- Global command-line options
  - `-c, --config` - Custom config file path
  - `-p, --project` - Override project key
  - `-o, --output` - Output format selection
  - `--no-color` - Disable colored output
  - `--debug` - Enable debug logging

#### API & Authentication
- Comprehensive Jira REST API v3 and Agile API v1 integration
- Multiple authentication methods
  - Basic authentication (email + API token)
  - Bearer token authentication
  - OAuth support (foundation)
- HTTP client with proper error handling
- Rate limiting awareness
- Structured error responses

#### Developer Experience
- Full TypeScript support with comprehensive type definitions
- Built with Bun for fast startup and execution
- Cross-platform binary compilation support
  - Linux x64 and ARM64
  - macOS x64 and ARM64 (Apple Silicon)
  - Windows x64
- Development hot reload support
- Comprehensive test suite with Bun test
- ESLint and Prettier for code quality
- TypeScript strict mode

#### Documentation
- Comprehensive README with examples
- Command-specific documentation in `docs/commands/`
- Configuration guide
- Getting started guide
- Scripting and automation examples
- CI/CD integration examples
- AI agent integration patterns
- Troubleshooting guide
- Build and development guide

### Technical Details

#### Dependencies
- Runtime: Bun >= 1.1.0
- CLI Framework: Commander.js + @inquirer/prompts
- HTTP: Native fetch API (Bun)
- Configuration: YAML parser
- Output: chalk, cli-table3, fast-xml-parser
- TUI: @inquirer/prompts + ink
- Utilities: marked, marked-terminal, open, ora

#### Architecture
- Modular command structure
- Middleware for authentication and output handling
- Endpoint-based API organization
- Reusable output formatters and renderers
- Type-safe Jira entity definitions
- Utility modules (JQL builder, date parsing, markdown rendering)

[0.1.0]: https://github.com/sarlalian/scry/releases/tag/v0.1.0
