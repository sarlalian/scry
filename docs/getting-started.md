# Getting Started with Scry

This guide will help you install, configure, and start using Scry to manage your Jira projects from the command line.

## Installation

### Using Bun (Recommended)

```bash
bun install -g scry
```

### Using npm

```bash
npm install -g scry
```

### Using Binary Releases

Download the latest release for your platform from the [releases page](https://github.com/sarlalian/scry/releases):

**macOS/Linux:**
```bash
curl -L https://github.com/sarlalian/scry/releases/latest/download/scry-[platform] -o scry
chmod +x scry
sudo mv scry /usr/local/bin/
```

**Windows:**
Download the `scry-windows.exe` file and add it to your PATH.

### Building from Source

Requirements: [Bun](https://bun.sh) >= 1.1.0

```bash
git clone https://github.com/sarlalian/scry.git
cd scry
bun install
bun run build:local
# Binary will be in dist/scry
```

## Initial Configuration

### Step 1: Initialize Configuration

Run the interactive configuration wizard:

```bash
scry init
```

This will prompt you for:

- **Jira Server URL**: Your Jira instance URL (e.g., `https://your-domain.atlassian.net`)
- **Email/Login**: Your Jira account email
- **Authentication Type**: Choose `basic` or `bearer` (most Atlassian Cloud instances use `basic`)
- **Default Project** (optional): Your primary project key (e.g., `PROJ`)

The configuration will be saved to `~/.config/scry/config.yml` by default.

### Step 2: Generate and Set API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name (e.g., "Scry CLI")
4. Copy the generated token

Set the token as an environment variable:

```bash
export SCRY_API_TOKEN=your-token-here
```

To make it permanent, add this line to your shell configuration file:

**Bash** (`~/.bashrc` or `~/.bash_profile`):
```bash
echo 'export SCRY_API_TOKEN=your-token-here' >> ~/.bashrc
source ~/.bashrc
```

**Zsh** (`~/.zshrc`):
```bash
echo 'export SCRY_API_TOKEN=your-token-here' >> ~/.zshrc
source ~/.zshrc
```

**Fish** (`~/.config/fish/config.fish`):
```fish
echo 'set -gx SCRY_API_TOKEN your-token-here' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Step 3: Verify Connection

Test your configuration:

```bash
scry me
```

If successful, you'll see your Jira user information displayed. If you encounter an error, check your configuration and API token.

## Configuration File Locations

Scry searches for configuration files in the following order:

1. Path specified by `SCRY_CONFIG_FILE` environment variable
2. `.scry.yml` in current directory (project-specific config)
3. `~/.config/scry/config.yml` (default location)
4. `~/.scry.yml` (alternative home directory location)

The first file found will be used.

## First Commands

### View Your Information

```bash
scry me
```

### List Issues

View all issues in your default project:

```bash
scry issue list
```

List only your assigned issues:

```bash
scry issue list -a currentUser()
```

Filter by status:

```bash
scry issue list -s "In Progress"
```

### View an Issue

```bash
scry issue view PROJ-123
```

### Create an Issue

Interactive mode (prompts for details):

```bash
scry issue create
```

Quick creation with flags:

```bash
scry issue create -p PROJ -t Task -s "My first task from Scry"
```

### List Projects

See all available projects:

```bash
scry project list
```

### List Boards

View all boards:

```bash
scry board list
```

### List Sprints

View sprints for your default board:

```bash
scry sprint list
```

View active sprints only:

```bash
scry sprint list --state active
```

## Global Options

All commands support these global options:

```bash
-c, --config <path>      # Use a specific config file
-p, --project <key>      # Override the default project
-o, --output <format>    # Set output format (table|plain|json|xml|csv)
--no-color              # Disable colored output
--debug                 # Show debug information including API calls
```

### Examples

Use a different config file:

```bash
scry -c ~/work-jira.yml issue list
```

Override project for a single command:

```bash
scry -p OTHERPROJ issue list
```

Get JSON output for scripting:

```bash
scry issue list -o json
```

## Output Formats

Scry supports multiple output formats for different use cases:

### Table (Default)

Rich, colored tables perfect for human-readable terminal output:

```bash
scry issue list
```

### Plain

Simple text output without colors or formatting:

```bash
scry issue list -o plain
```

### JSON

Structured JSON for scripting and automation:

```bash
scry issue list -o json
```

All JSON responses follow this structure:

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

## Working with Multiple Jira Instances

If you work with multiple Jira instances (e.g., work and personal), create separate config files:

**Work config** (`~/.config/scry/work.yml`):
```yaml
server: https://work.atlassian.net
login: you@work.com
project:
  key: WORK
```

**Personal config** (`~/.config/scry/personal.yml`):
```yaml
server: https://personal.atlassian.net
login: you@personal.com
project:
  key: HOME
```

Then use the `-c` flag to specify which config to use:

```bash
scry -c ~/.config/scry/work.yml issue list
scry -c ~/.config/scry/personal.yml issue list
```

Or set the environment variable:

```bash
export SCRY_CONFIG_FILE=~/.config/scry/work.yml
scry issue list
```

## Next Steps

- Read the [Issue Commands Guide](commands/issues.md) for detailed issue management
- Learn about [Configuration Options](configuration.md) for advanced setup
- Explore [Scripting with Scry](scripting.md) for automation
- Check [Troubleshooting](troubleshooting.md) if you encounter issues

## Getting Help

View help for any command:

```bash
scry --help
scry issue --help
scry issue create --help
```

For more information, visit:
- [GitHub Repository](https://github.com/sarlalian/scry)
- [Issue Tracker](https://github.com/sarlalian/scry/issues)
- [Documentation Index](../README.md)
