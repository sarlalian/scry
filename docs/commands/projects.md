# Project, Board, and Release Commands

Complete guide to managing Jira Projects, Boards, Releases, and Users with Scry.

## Table of Contents

- [Project Management](#project-management)
- [Board Management](#board-management)
- [Release Management](#release-management)
- [User Management](#user-management)
- [Utility Commands](#utility-commands)

## Project Management

### Listing Projects

View all Jira projects you have access to.

#### Basic Usage

```bash
scry project list
# or use the alias
scry project ls
```

This displays:
- Project key
- Project name
- Project type (classic or next-gen)
- Project lead

#### Output Formats

```bash
# Table format (default, human-readable)
scry project list

# Plain text without colors
scry project list -o plain

# JSON format for scripting
scry project list -o json

# CSV format for spreadsheets
scry project list -o csv > projects.csv

# XML format
scry project list -o xml
```

#### Use Cases

**Find project key:**
```bash
scry project list | grep "Customer Portal"
```

**Export project list:**
```bash
scry project list -o json > projects.json
```

**Count projects:**
```bash
scry project list -o json | jq '.data | length'
```

### Working with Projects

#### Set Default Project

Edit your config file (`~/.config/scry/config.yml`):

```yaml
project:
  key: PROJ
  type: classic  # or 'next-gen'
```

Or use environment variable:
```bash
export SCRY_PROJECT=PROJ
```

#### Override Project per Command

```bash
# Use different project for single command
scry -p OTHERPROJ issue list

# Create issue in specific project
scry issue create -p PROJ -t Task -s "New task"
```

#### Multiple Projects

Work with multiple projects by specifying `-p` flag:

```bash
# List issues from different projects
scry -p PROJ1 issue list
scry -p PROJ2 issue list

# Create issues in different projects
scry issue create -p PROJ1 -t Story -s "Story in project 1"
scry issue create -p PROJ2 -t Bug -s "Bug in project 2"
```

### Project Best Practices

1. **Set default project** in config for most-used project
2. **Use project aliases** in shell for quick switching:
   ```bash
   alias scry-work='scry -p WORK'
   alias scry-personal='scry -p HOME'
   ```
3. **Document project keys** for your team
4. **Use project prefixes** consistently in issue keys

## Board Management

Boards are views of issues that help teams track work. Scrum boards have sprints, Kanban boards have continuous flow.

### Listing Boards

View all boards you have access to.

#### Basic Usage

```bash
scry board list
# or use the alias
scry board ls
```

This displays:
- Board ID
- Board name
- Board type (scrum or kanban)
- Project key

#### Filter by Board Type

```bash
# List only Scrum boards
scry board list -t scrum

# List only Kanban boards
scry board list -t kanban
```

#### Output Formats

```bash
# Table format (default)
scry board list

# JSON format
scry board list -o json

# CSV format
scry board list -o csv > boards.csv
```

### Working with Boards

#### Find Board ID

Board IDs are needed for sprint commands:

```bash
# List boards and note the ID
scry board list

# Get specific board ID with jq
scry board list -o json | jq -r '.data[] | select(.name=="My Board") | .id'
```

#### Set Default Board

Edit your config file (`~/.config/scry/config.yml`):

```yaml
board:
  id: 123
  type: scrum  # or 'kanban'
```

Then sprint commands use this board by default:
```bash
scry sprint list
```

#### Override Board per Command

```bash
# Use different board for single command
scry sprint list -b 456
```

### Board Types

#### Scrum Boards

Scrum boards support sprints:
- Create sprints: `scry sprint create -b 123`
- List sprints: `scry sprint list -b 123`
- Add issues to sprints: `scry sprint add 456 PROJ-123`

See [Sprint Commands](sprints.md) for detailed sprint management.

#### Kanban Boards

Kanban boards have continuous flow:
- No sprints
- Issues flow through columns
- Work is pulled as capacity allows

For Kanban boards, focus on:
```bash
# List issues in various statuses
scry issue list -s "To Do"
scry issue list -s "In Progress"
scry issue list -s "Done"
```

### Opening Boards in Browser

```bash
# Open board in browser
scry open -b 123

# Open board with specific sprint
scry open -b 123 -s 456
```

See [Utility Commands](#utility-commands) for more details.

## Release Management

Releases (also called Versions in Jira) track which issues are included in each release of your product.

### Listing Releases

View releases for a project.

#### Basic Usage

```bash
# List releases for default project
scry release list

# List releases for specific project
scry release list PROJ
```

This displays:
- Version ID
- Version name
- Release date
- Released status
- Description

#### Output Formats

```bash
# Table format (default)
scry release list

# JSON format
scry release list -o json

# CSV format
scry release list PROJ -o csv > releases.csv
```

### Creating Releases

Create a new release/version.

#### Interactive Creation

```bash
scry release create
```

The wizard prompts for:
1. Project key (if not set as default)
2. Version name
3. Description (optional)
4. Release date (optional)

#### Quick Creation with Flags

```bash
scry release create \
  -p PROJ \
  -n "v2.0.0" \
  -d "Major release with new authentication system"
```

#### Creation Options

| Option | Description | Example |
|--------|-------------|---------|
| `-p, --project` | Project key | `-p PROJ` |
| `-n, --name` | Release name | `-n "v1.2.0"` |
| `-d, --description` | Release description | `-d "Bug fixes"` |

### Release Naming Conventions

**Semantic Versioning:**
```bash
scry release create -p PROJ -n "v1.2.3"
scry release create -p PROJ -n "v2.0.0"
```

**Date-based:**
```bash
scry release create -p PROJ -n "2024.01.15"
scry release create -p PROJ -n "2024-Q1"
```

**Named Releases:**
```bash
scry release create -p PROJ -n "Winter Release 2024"
scry release create -p PROJ -n "MVP Launch"
```

### Working with Releases

#### Assign Issues to Release

Use the issue edit command:
```bash
scry issue edit PROJ-123 --fix-version "v1.2.0"
```

Note: Direct release assignment through Scry is done via issue editing in the Jira API.

#### Query Issues by Release

```bash
# Issues in specific release
scry issue list -q "fixVersion = 'v1.2.0'"

# Issues without release
scry issue list -q "fixVersion is EMPTY"

# Issues in unreleased versions
scry issue list -q "fixVersion in unreleasedVersions()"
```

#### Track Release Progress

```bash
# Total issues in release
scry issue list -q "fixVersion = 'v1.2.0'" -o json | jq '.meta.total'

# Completed issues
scry issue list -q "fixVersion = 'v1.2.0' AND status = Done" -o json | jq '.meta.total'

# Remaining work
scry issue list -q "fixVersion = 'v1.2.0' AND status != Done"
```

### Release Best Practices

1. **Create releases early** in the development cycle
2. **Use consistent naming** (semantic versioning recommended)
3. **Set release dates** to help with planning
4. **Track progress** with JQL queries
5. **Update release status** when shipped

### Release Workflow Example

```bash
# 1. Create release
scry release create -p PROJ -n "v2.1.0" -d "Q1 2024 release"

# 2. Plan release (assign issues)
scry issue list -q "project = PROJ AND fixVersion is EMPTY AND status = 'To Do'" --limit 20

# Issues are assigned to release via Jira UI or API

# 3. Track progress during development
scry issue list -q "fixVersion = 'v2.1.0' AND status != Done"

# 4. Before release, verify all done
scry issue list -q "fixVersion = 'v2.1.0' AND status != Done"

# 5. Mark as released (via Jira UI)
```

## User Management

Search for users in your Jira instance.

### Searching Users

Find users by name or email.

#### Basic Usage

```bash
scry user search john
```

This displays:
- Account ID
- Display name
- Email address (if visible)
- Active status

#### Search Options

```bash
# Search by partial name
scry user search "john doe"

# Limit results
scry user search john --limit 10

# All matching users
scry user search smith --limit 100
```

#### Output Formats

```bash
# Table format (default)
scry user search john

# JSON format (useful for getting account IDs)
scry user search john -o json

# CSV format
scry user search john -o csv > users.csv
```

### Getting User Information

#### Current User

View your own user information:

```bash
scry me
```

This shows:
- Display name
- Email
- Account ID
- Active status
- Time zone

#### Finding Account IDs

Account IDs are needed for assigning issues:

```bash
# Search for user and get account ID
scry user search "jane smith" -o json | jq -r '.data[0].accountId'

# Or use table format and copy the ID
scry user search "jane smith"
```

### User Commands in Workflows

**Assign issue to user:**
```bash
# Search for user
scry user search john

# Get account ID from results, then assign
scry issue assign PROJ-123 557058:1234abcd-5678-90ef-ghij-klmnopqrstuv
```

**Find user's issues:**
```bash
# Get account ID
ACCOUNT_ID=$(scry user search "john doe" -o json | jq -r '.data[0].accountId')

# List their issues
scry issue list -q "assignee = '$ACCOUNT_ID'"
```

**Create issue and assign to user:**
```bash
# Search for user
USER_ID=$(scry user search "jane" -o json | jq -r '.data[0].accountId')

# Create and assign
scry issue create -p PROJ -t Task -s "New task" -a "$USER_ID"
```

## Utility Commands

### Open in Browser

Open Jira items in your default web browser.

#### Open Issue

```bash
scry open PROJ-123
```

#### Open Project

```bash
scry open PROJ
```

#### Open Board

```bash
scry open -b 123
```

#### Open Sprint

```bash
# Open sprint in board context
scry open -b 123 -s 456
```

#### Use Cases

```bash
# Quickly view issue details in browser
scry issue view PROJ-123  # CLI view
scry open PROJ-123        # Browser view

# Open board to see visual layout
scry open -b 123

# Jump to specific sprint
scry open -b 123 -s 456
```

### Get Current User Info

```bash
scry me
```

Displays:
- Display name
- Email address
- Account ID
- Time zone
- Jira profile URL

Useful for:
- Verifying authentication
- Getting your account ID for assignment
- Checking which account you're using

## Advanced Usage

### Multi-Project Workflows

#### Working Across Projects

```bash
#!/bin/bash
# cross-project-report.sh - Generate report across projects

PROJECTS="PROJ1 PROJ2 PROJ3"

for project in $PROJECTS; do
  echo "=== $project ==="
  scry -p $project issue list -s "~Done" --limit 5
  echo ""
done
```

#### Moving Issues Between Projects

Issues cannot be directly moved between projects, but you can clone:

```bash
# Clone issue to different project
scry issue clone PROJ1-123 -p PROJ2 -s "Copied from PROJ1-123"
```

### Board Analytics

#### Board Issue Summary

```bash
#!/bin/bash
# board-summary.sh - Summarize issues on a board

BOARD_ID=$1

echo "=== Board Summary ==="

# Get board info
scry board list -o json | jq -r ".data[] | select(.id==$BOARD_ID) | \"Board: \(.name)\""

echo ""
echo "Active Sprint:"
scry sprint list -b $BOARD_ID --state active

echo ""
echo "Issues by Status:"
scry issue list -q "sprint in openSprints()" -o json | \
  jq -r '.data | group_by(.status) | .[] | "\(.[0].status): \(length)"'
```

### Release Planning

#### Release Readiness Check

```bash
#!/bin/bash
# release-ready.sh - Check if release is ready

VERSION=$1

echo "=== Release Readiness: $VERSION ==="
echo ""

# Total issues
echo "Total Issues:"
scry issue list -q "fixVersion = '$VERSION'" -o json | jq '.meta.total'

# Incomplete issues
echo ""
echo "Incomplete Issues:"
scry issue list -q "fixVersion = '$VERSION' AND status != Done" -o json | jq '.meta.total'

# Blockers
echo ""
echo "Blocking Issues:"
scry issue list -q "fixVersion = '$VERSION' AND status != Done AND priority = Blocker"

# Details
echo ""
echo "Remaining Work:"
scry issue list -q "fixVersion = '$VERSION' AND status != Done" --columns key,summary,status,assignee
```

Usage:
```bash
chmod +x release-ready.sh
./release-ready.sh "v2.0.0"
```

### User Activity Reports

#### User Workload

```bash
#!/bin/bash
# user-workload.sh - Check user's workload

USER=$1

echo "=== Workload Report: $USER ==="
echo ""

# Search for user
ACCOUNT_ID=$(scry user search "$USER" -o json | jq -r '.data[0].accountId')
DISPLAY_NAME=$(scry user search "$USER" -o json | jq -r '.data[0].displayName')

echo "User: $DISPLAY_NAME"
echo "Account ID: $ACCOUNT_ID"
echo ""

# Assigned issues
echo "Assigned Issues:"
scry issue list -q "assignee = '$ACCOUNT_ID' AND status != Done" -o json | jq '.meta.total'

# In progress
echo ""
echo "In Progress:"
scry issue list -q "assignee = '$ACCOUNT_ID' AND status = 'In Progress'"

# By priority
echo ""
echo "By Priority:"
scry issue list -q "assignee = '$ACCOUNT_ID' AND status != Done" -o json | \
  jq -r '.data | group_by(.priority) | .[] | "\(.[0].priority): \(length)"'
```

## Integration Examples

### Project Dashboard

Create a dashboard showing project status:

```bash
#!/bin/bash
# project-dashboard.sh

PROJECT=$1

echo "╔════════════════════════════════════════╗"
echo "║     PROJECT DASHBOARD: $PROJECT       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Project info
echo "📊 OVERVIEW"
echo "─────────────────────────────────────────"
scry project list | grep "$PROJECT"
echo ""

# Issue counts
echo "📝 ISSUES"
echo "─────────────────────────────────────────"
TOTAL=$(scry issue list -p $PROJECT -o json | jq '.meta.total')
DONE=$(scry issue list -p $PROJECT -s Done -o json | jq '.meta.total')
TODO=$(scry issue list -p $PROJECT -s "To Do" -o json | jq '.meta.total')
PROGRESS=$(scry issue list -p $PROJECT -s "In Progress" -o json | jq '.meta.total')

echo "Total Issues: $TOTAL"
echo "Done: $DONE"
echo "To Do: $TODO"
echo "In Progress: $PROGRESS"
echo ""

# Active sprint
echo "🏃 ACTIVE SPRINT"
echo "─────────────────────────────────────────"
scry sprint list --state active
echo ""

# Recent issues
echo "🆕 RECENT ISSUES (Last 5)"
echo "─────────────────────────────────────────"
scry issue list -p $PROJECT --created -7d --limit 5 --columns key,summary,status
```

### Release Notes Generator

Generate release notes from issue data:

```bash
#!/bin/bash
# generate-release-notes.sh

VERSION=$1
OUTPUT="release-notes-${VERSION}.md"

echo "# Release Notes: $VERSION" > $OUTPUT
echo "" >> $OUTPUT
echo "Generated on $(date)" >> $OUTPUT
echo "" >> $OUTPUT

# Features
echo "## New Features" >> $OUTPUT
echo "" >> $OUTPUT
scry issue list -q "fixVersion = '$VERSION' AND type = Story AND status = Done" -o json | \
  jq -r '.data[] | "- \(.key): \(.summary)"' >> $OUTPUT
echo "" >> $OUTPUT

# Bug fixes
echo "## Bug Fixes" >> $OUTPUT
echo "" >> $OUTPUT
scry issue list -q "fixVersion = '$VERSION' AND type = Bug AND status = Done" -o json | \
  jq -r '.data[] | "- \(.key): \(.summary)"' >> $OUTPUT
echo "" >> $OUTPUT

# Improvements
echo "## Improvements" >> $OUTPUT
echo "" >> $OUTPUT
scry issue list -q "fixVersion = '$VERSION' AND type = Task AND status = Done" -o json | \
  jq -r '.data[] | "- \(.key): \(.summary)"' >> $OUTPUT

echo "Release notes generated: $OUTPUT"
```

## Related Documentation

- [Issue Commands](issues.md) - Managing issues
- [Epic Commands](epics.md) - Managing epics
- [Sprint Commands](sprints.md) - Managing sprints
- [Configuration](../configuration.md) - Setting defaults
- [Scripting](../scripting.md) - Automation examples
