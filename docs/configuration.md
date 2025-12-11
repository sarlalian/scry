# Configuration Guide

Complete guide to configuring Scry for your Jira instance.

## Table of Contents

- [Configuration File](#configuration-file)
- [Environment Variables](#environment-variables)
- [Configuration Priority](#configuration-priority)
- [Authentication](#authentication)
- [Project Settings](#project-settings)
- [Board Settings](#board-settings)
- [Output Settings](#output-settings)
- [Issue Type Configuration](#issue-type-configuration)
- [Multiple Configurations](#multiple-configurations)
- [Troubleshooting Configuration](#troubleshooting-configuration)

## Configuration File

### File Locations

Scry searches for configuration files in this order:

1. Path specified by `SCRY_CONFIG_FILE` environment variable
2. `.scry.yml` in current directory (project-specific)
3. `~/.config/scry/config.yml` (default location)
4. `~/.scry.yml` (alternative home directory)

The first file found is used.

### Creating Configuration

#### Using Init Command

The easiest way to create configuration:

```bash
scry init
```

This interactive wizard creates `~/.config/scry/config.yml` with your settings.

#### Manual Creation

Create the file manually:

```bash
mkdir -p ~/.config/scry
touch ~/.config/scry/config.yml
```

Then edit with your favorite editor:

```bash
nano ~/.config/scry/config.yml
# or
vim ~/.config/scry/config.yml
```

### Configuration Schema

#### Complete Example

```yaml
# Jira server URL (required)
server: https://your-domain.atlassian.net

# Login email (required)
login: your-email@example.com

# Authentication settings
auth:
  type: basic  # or 'bearer'
  # token: your-token-here  # Not recommended - use env var instead

# Default project settings
project:
  key: PROJ  # Default project key
  type: classic  # or 'next-gen'

# Default board settings (for sprint commands)
board:
  id: 123  # Board ID
  type: scrum  # or 'kanban'

# Epic settings (optional)
epic:
  name: Epic  # Epic field name (rarely needs changing)
  link: Epic Link  # Epic link field name (rarely needs changing)

# Issue type configuration (optional)
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

# Output format settings
output:
  format: table  # table|plain|json|xml|csv
  colors: true  # Enable colored output
```

#### Minimal Configuration

The minimum required configuration:

```yaml
server: https://your-domain.atlassian.net
login: your-email@example.com
```

Then set `SCRY_API_TOKEN` environment variable for authentication.

## Environment Variables

Environment variables override config file settings.

### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SCRY_API_TOKEN` | Jira API token (required) | Your API token |
| `SCRY_SERVER` | Jira server URL | `https://domain.atlassian.net` |
| `SCRY_LOGIN` | Jira login email | `user@example.com` |
| `SCRY_PROJECT` | Default project key | `PROJ` |
| `SCRY_AUTH_TYPE` | Authentication type | `basic` or `bearer` |
| `SCRY_CONFIG_FILE` | Config file path | `~/.config/scry/work.yml` |

### Setting Environment Variables

#### Temporary (Current Session)

```bash
export SCRY_API_TOKEN=your-token-here
export SCRY_PROJECT=PROJ
```

#### Permanent

**Bash** (`~/.bashrc` or `~/.bash_profile`):
```bash
echo 'export SCRY_API_TOKEN=your-token-here' >> ~/.bashrc
echo 'export SCRY_PROJECT=PROJ' >> ~/.bashrc
source ~/.bashrc
```

**Zsh** (`~/.zshrc`):
```bash
echo 'export SCRY_API_TOKEN=your-token-here' >> ~/.zshrc
echo 'export SCRY_PROJECT=PROJ' >> ~/.zshrc
source ~/.zshrc
```

**Fish** (`~/.config/fish/config.fish`):
```fish
echo 'set -gx SCRY_API_TOKEN your-token-here' >> ~/.config/fish/config.fish
echo 'set -gx SCRY_PROJECT PROJ' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Security Best Practices

1. **Always use environment variables for tokens**
   ```bash
   export SCRY_API_TOKEN=your-token
   ```
   Never put tokens in config files!

2. **Use separate tokens for different environments**
   ```bash
   export SCRY_API_TOKEN_PROD=prod-token
   export SCRY_API_TOKEN_DEV=dev-token
   ```

3. **Rotate tokens regularly**
   Generate new tokens at [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

4. **Use restrictive file permissions**
   ```bash
   chmod 600 ~/.config/scry/config.yml
   ```

## Configuration Priority

Settings are applied in this order (later overrides earlier):

1. Configuration file defaults
2. Configuration file settings
3. Environment variables
4. Command-line flags

### Example

Config file (`~/.config/scry/config.yml`):
```yaml
server: https://company.atlassian.net
project:
  key: PROJ
```

Environment:
```bash
export SCRY_PROJECT=OTHER
```

Command:
```bash
scry -p THIRD issue list
```

Result: Uses `THIRD` (command flag wins)

## Authentication

### Authentication Types

#### Basic Authentication (Recommended)

Most Atlassian Cloud instances use Basic authentication:

```yaml
auth:
  type: basic
```

Set your API token:
```bash
export SCRY_API_TOKEN=your-atlassian-api-token
```

**Generate API Token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name and copy the token
4. Set as environment variable

#### Bearer Authentication

For some self-hosted or enterprise Jira instances:

```yaml
auth:
  type: bearer
```

Set your bearer token:
```bash
export SCRY_API_TOKEN=your-bearer-token
```

### Testing Authentication

Verify your authentication works:

```bash
scry me
```

If successful, you'll see your user information. If not, check:
- Token is correct and not expired
- Server URL is correct
- Login email matches your Jira account
- Authentication type is correct

## Project Settings

### Default Project

Set a default project to avoid typing `-p` flag:

```yaml
project:
  key: PROJ
  type: classic  # or 'next-gen'
```

Now these are equivalent:
```bash
scry issue list
scry issue list -p PROJ
```

### Project Type

Specify project type for better compatibility:

- `classic` - Traditional Jira projects
- `next-gen` - Next-gen/Team-managed projects

```yaml
project:
  type: classic
```

### Multiple Projects

Don't set a default if you work with many projects:

```yaml
# No project key set
project:
  type: classic
```

Then specify project per command:
```bash
scry issue list -p PROJ1
scry issue list -p PROJ2
```

## Board Settings

### Default Board

Set default board for sprint commands:

```yaml
board:
  id: 123
  type: scrum
```

Now these are equivalent:
```bash
scry sprint list
scry sprint list -b 123
```

### Finding Board ID

```bash
# List all boards
scry board list

# Or from Jira URL:
# https://company.atlassian.net/jira/software/projects/PROJ/boards/123
#                                                              ^^^
#                                                           Board ID
```

### Board Type

Specify board type:

- `scrum` - Scrum board with sprints
- `kanban` - Kanban board (continuous flow)

```yaml
board:
  type: scrum
```

## Output Settings

### Default Output Format

Set preferred output format:

```yaml
output:
  format: table  # table|plain|json|xml|csv
  colors: true
```

Options:
- `table` - Rich formatted tables (default)
- `plain` - Plain text without colors
- `json` - JSON format for scripting
- `xml` - XML format
- `csv` - CSV for spreadsheets

### Disable Colors

For terminals that don't support colors:

```yaml
output:
  colors: false
```

Or use command flag:
```bash
scry issue list --no-color
```

### Override per Command

```bash
scry issue list -o json
scry issue list -o csv
```

## Issue Type Configuration

### Default Issue Types

Scry includes standard issue types:

```yaml
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
```

### Custom Issue Types

Add your custom issue types:

```yaml
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
    - name: Spike
      handle: Spike
    - name: Technical Debt
      handle: Technical Debt
```

The `handle` is the exact name used in Jira API.

## Multiple Configurations

### Use Cases

- Multiple Jira instances (work, personal)
- Different projects with different settings
- Production vs. development environments
- Team-specific configurations

### Method 1: Multiple Files

Create separate config files:

**Work Jira** (`~/.config/scry/work.yml`):
```yaml
server: https://work.atlassian.net
login: you@work.com
project:
  key: WORK
board:
  id: 100
```

**Personal Jira** (`~/.config/scry/personal.yml`):
```yaml
server: https://personal.atlassian.net
login: you@personal.com
project:
  key: HOME
board:
  id: 50
```

Use with environment variable:
```bash
export SCRY_CONFIG_FILE=~/.config/scry/work.yml
scry issue list

export SCRY_CONFIG_FILE=~/.config/scry/personal.yml
scry issue list
```

Or command flag:
```bash
scry -c ~/.config/scry/work.yml issue list
scry -c ~/.config/scry/personal.yml issue list
```

### Method 2: Shell Aliases

Create aliases in your shell config:

```bash
# ~/.bashrc or ~/.zshrc
alias scry-work='scry -c ~/.config/scry/work.yml'
alias scry-personal='scry -c ~/.config/scry/personal.yml'
```

Usage:
```bash
scry-work issue list
scry-personal issue list
```

### Method 3: Directory-Specific Config

Place `.scry.yml` in project directories:

```
~/projects/
├── work-project/
│   ├── .scry.yml  # Work Jira config
│   └── ...
└── personal-project/
    ├── .scry.yml  # Personal Jira config
    └── ...
```

Scry automatically uses the config in the current directory.

### Method 4: Shell Functions

Create smart switching functions:

```bash
# ~/.bashrc or ~/.zshrc

function use-work-jira() {
    export SCRY_CONFIG_FILE=~/.config/scry/work.yml
    export SCRY_API_TOKEN=$SCRY_API_TOKEN_WORK
    echo "Switched to work Jira"
}

function use-personal-jira() {
    export SCRY_CONFIG_FILE=~/.config/scry/personal.yml
    export SCRY_API_TOKEN=$SCRY_API_TOKEN_PERSONAL
    echo "Switched to personal Jira"
}
```

Usage:
```bash
use-work-jira
scry issue list

use-personal-jira
scry issue list
```

## Configuration Examples

### Minimal Cloud Setup

```yaml
server: https://mycompany.atlassian.net
login: me@mycompany.com
```

### Complete Cloud Setup

```yaml
server: https://mycompany.atlassian.net
login: me@mycompany.com
auth:
  type: basic
project:
  key: PROJ
  type: classic
board:
  id: 123
  type: scrum
output:
  format: table
  colors: true
```

### Self-Hosted Jira

```yaml
server: https://jira.internal.company.com
login: myusername
auth:
  type: bearer
project:
  key: DEV
```

### Development vs. Production

**Development** (`~/.config/scry/dev.yml`):
```yaml
server: https://dev-jira.company.net
login: dev-user@company.com
project:
  key: DEV
output:
  format: json  # For scripting
  colors: false
```

**Production** (`~/.config/scry/prod.yml`):
```yaml
server: https://jira.company.net
login: user@company.com
project:
  key: PROD
output:
  format: table
  colors: true
```

### Team Configuration

```yaml
server: https://company.atlassian.net
login: team-lead@company.com
project:
  key: TEAM
  type: next-gen
board:
  id: 456
  type: scrum
issue:
  types:
    - name: Story
      handle: Story
    - name: Bug
      handle: Bug
    - name: Task
      handle: Task
    - name: Spike
      handle: Spike
output:
  format: table
  colors: true
```

## Troubleshooting Configuration

### Configuration Not Found

**Problem**: `No configuration file found` error

**Solutions**:
1. Create config with `scry init`
2. Check file exists: `ls ~/.config/scry/config.yml`
3. Use custom path: `scry -c /path/to/config.yml`
4. Check file permissions: `chmod 644 ~/.config/scry/config.yml`

### Authentication Fails

**Problem**: Authentication errors when running commands

**Solutions**:
1. Verify API token is set: `echo $SCRY_API_TOKEN`
2. Check server URL is correct in config
3. Verify login email matches your Jira account
4. Test with: `scry me`
5. Generate new API token if expired

### Invalid Configuration

**Problem**: Error parsing configuration file

**Solutions**:
1. Check YAML syntax (use validator: https://www.yamllint.com/)
2. Verify indentation (YAML is sensitive to spaces)
3. Check for tabs (use spaces instead)
4. Review example configs in this guide

### Wrong Configuration Used

**Problem**: Scry is using unexpected configuration

**Solutions**:
1. Check which config is loaded: Look for the file in order:
   - `$SCRY_CONFIG_FILE`
   - `./.scry.yml`
   - `~/.config/scry/config.yml`
   - `~/.scry.yml`
2. Remove unwanted configs
3. Use explicit path: `scry -c ~/.config/scry/config.yml`

### Environment Variables Not Working

**Problem**: Environment variables don't override config

**Solutions**:
1. Check variable is exported: `export SCRY_PROJECT=PROJ`
2. Verify variable name is correct (uppercase)
3. Check spelling: `echo $SCRY_PROJECT`
4. Source your shell config: `source ~/.bashrc`

## Configuration Validation

### Check Current Configuration

View effective configuration:

```bash
scry me --debug
```

This shows which config file and values are being used.

### Test Configuration

Test each setting:

```bash
# Test authentication
scry me

# Test project setting
scry issue list

# Test board setting
scry sprint list
```

### Verify File Permissions

Ensure proper permissions:

```bash
# Check permissions
ls -la ~/.config/scry/config.yml

# Set correct permissions (owner read/write only)
chmod 600 ~/.config/scry/config.yml
```

## Advanced Configuration

### Environment-Specific Tokens

Manage multiple API tokens:

```bash
# ~/.bashrc or ~/.zshrc

# Store tokens
export JIRA_WORK_TOKEN=work-token-here
export JIRA_PERSONAL_TOKEN=personal-token-here

# Functions to switch
function work-jira() {
    export SCRY_CONFIG_FILE=~/.config/scry/work.yml
    export SCRY_API_TOKEN=$JIRA_WORK_TOKEN
}

function personal-jira() {
    export SCRY_CONFIG_FILE=~/.config/scry/personal.yml
    export SCRY_API_TOKEN=$JIRA_PERSONAL_TOKEN
}
```

### Dynamic Configuration

Script to switch configs:

```bash
#!/bin/bash
# switch-jira.sh

case "$1" in
    work)
        export SCRY_CONFIG_FILE=~/.config/scry/work.yml
        export SCRY_API_TOKEN=$JIRA_WORK_TOKEN
        echo "Switched to work Jira"
        ;;
    personal)
        export SCRY_CONFIG_FILE=~/.config/scry/personal.yml
        export SCRY_API_TOKEN=$JIRA_PERSONAL_TOKEN
        echo "Switched to personal Jira"
        ;;
    *)
        echo "Usage: source switch-jira.sh [work|personal]"
        return 1
        ;;
esac
```

Usage:
```bash
source switch-jira.sh work
scry issue list
```

## Related Documentation

- [Getting Started](getting-started.md) - Initial setup
- [Scripting](scripting.md) - Using config in scripts
- [Troubleshooting](troubleshooting.md) - Common issues
