# Sprint Commands

Complete guide to managing Jira Sprints with Scry.

## Table of Contents

- [Overview](#overview)
- [Listing Sprints](#listing-sprints)
- [Creating Sprints](#creating-sprints)
- [Adding Issues to Sprints](#adding-issues-to-sprints)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Sprints are time-boxed iterations where teams complete a set amount of work. In Scrum methodology, sprints are typically 1-4 weeks long and contain a planned set of issues.

Scry provides commands to manage sprints on Scrum boards, including listing, creating, and adding issues to sprints.

## Listing Sprints

### Basic Usage

List sprints from your default board:

```bash
scry sprint list
# or use the alias
scry sprint ls
```

This displays:
- Sprint ID
- Sprint name
- State (active, future, closed)
- Start and end dates
- Issue count

### List Sprints from Specific Board

```bash
scry sprint list -b 123
# or
scry sprint list --board 123
```

### Filter by Sprint State

#### Active Sprints

```bash
scry sprint list --state active
```

Shows sprints that are currently in progress.

#### Future Sprints

```bash
scry sprint list --state future
```

Shows sprints that haven't started yet.

#### Closed Sprints

```bash
scry sprint list --state closed
```

Shows completed sprints.

### Output Formats

```bash
# Table format (default, human-readable)
scry sprint list

# Plain text without colors
scry sprint list -o plain

# JSON format for scripting
scry sprint list -o json

# CSV format for spreadsheets
scry sprint list -o csv > sprints.csv

# XML format
scry sprint list -o xml
```

### Common Queries

```bash
# Active sprints on specific board
scry sprint list -b 123 --state active

# All future sprints
scry sprint list --state future

# Recently closed sprints
scry sprint list --state closed
```

### Sprint List Options

| Option | Description | Example |
|--------|-------------|---------|
| `-b, --board` | Board ID | `-b 123` |
| `--state` | Filter by state | `--state active` |
| `-o, --output` | Output format | `-o json` |

## Creating Sprints

### Interactive Creation

Launch the interactive sprint creation wizard:

```bash
scry sprint create
```

The wizard prompts for:
1. Board ID (if not configured as default)
2. Sprint name
3. Sprint goal (optional)
4. Start date (optional)
5. End date (optional)

### Quick Creation with Flags

Create a sprint with all details in one command:

```bash
scry sprint create \
  -b 123 \
  -n "Sprint 42" \
  -g "Implement user authentication and improve performance"
```

### Creation Options

| Option | Description | Example |
|--------|-------------|---------|
| `-b, --board` | Board ID | `-b 123` |
| `-n, --name` | Sprint name | `-n "Sprint 42"` |
| `-g, --goal` | Sprint goal | `-g "Complete MVP"` |

### Sprint Naming Conventions

**Numbered Sprints:**
```bash
scry sprint create -b 123 -n "Sprint 15"
```

**Date-based:**
```bash
scry sprint create -b 123 -n "Sprint 2024-W01"
```

**Theme-based:**
```bash
scry sprint create -b 123 -n "Performance Sprint" -g "Reduce load times by 50%"
```

### Tips

- Sprint names should be unique within the board
- Goals help align the team on sprint objectives
- Start and end dates can be set after creation through Jira UI
- Newly created sprints are in "future" state by default

## Adding Issues to Sprints

Add existing issues to a sprint for sprint planning.

### Add Single Issue

```bash
scry sprint add 456 PROJ-123
```

Where:
- `456` is the sprint ID
- `PROJ-123` is the issue key

### Add Multiple Issues

Add multiple issues to a sprint in one command:

```bash
scry sprint add 456 PROJ-123 PROJ-124 PROJ-125
```

### Response

The command displays the result for each issue:
- Success or failure status
- Issue key
- Sprint ID
- Confirmation message

### Output Formats

```bash
# Table format (default)
scry sprint add 456 PROJ-123 PROJ-124

# JSON format
scry sprint add 456 PROJ-123 -o json

# Plain text
scry sprint add 456 PROJ-123 -o plain
```

### What Happens

When you add issues to a sprint:
1. The issue's sprint field is updated
2. The issue appears in the sprint in Jira
3. Sprint velocity metrics are updated
4. The issue is shown on the sprint board

### Finding Sprint IDs

Get the sprint ID from the list command:

```bash
# List sprints and note the ID
scry sprint list -b 123

# Or get active sprint ID with JSON
scry sprint list -b 123 --state active -o json | jq -r '.data[0].id'
```

### Common Use Cases

**Add issues from a query:**

```bash
# Get issue keys and add to sprint
scry issue list -t Story -s "To Do" -o json | \
  jq -r '.data[].key' | \
  xargs scry sprint add 456
```

**Plan sprint from epic:**

```bash
# Add all issues from an epic to sprint
scry issue list -q "Epic = EPIC-5 AND status = 'To Do'" -o json | \
  jq -r '.data[].key' | \
  xargs scry sprint add 456
```

**Add newly created issue:**

```bash
# Create issue and add to sprint
NEW_KEY=$(scry issue create -p PROJ -t Story -s "New story" -o json | jq -r '.data.key')
scry sprint add 456 $NEW_KEY
```

### Tips

- Issues can be added to future or active sprints
- Adding an issue to a new sprint removes it from the old sprint
- You need permission to edit the sprint and the issues
- Closed sprints cannot have issues added

## Best Practices

### Sprint Planning

**1. Create Sprint in Advance**

```bash
# Create next sprint before current one ends
scry sprint create -b 123 -n "Sprint 16" -g "Complete payment integration"
```

**2. Review Backlog**

```bash
# List unscheduled issues
scry issue list -q "project = PROJ AND sprint is EMPTY AND status = 'To Do'"
```

**3. Add Issues to Sprint**

```bash
# Add prioritized issues
scry sprint add 456 PROJ-200 PROJ-201 PROJ-202
```

**4. Verify Sprint Contents**

```bash
# Check what's in the sprint
scry issue list -q "sprint = 456"
```

### Sprint Execution

**Monitor Active Sprint:**

```bash
# View current sprint
scry sprint list --state active

# Check in-progress issues
scry issue list -q "sprint in openSprints() AND status = 'In Progress'"

# Check remaining work
scry issue list -q "sprint in openSprints() AND status != Done"
```

**Daily Standup Queries:**

```bash
# My work in current sprint
scry issue list -q "assignee = currentUser() AND sprint in openSprints()"

# Blocked issues
scry issue list -q "sprint in openSprints() AND status = Blocked"

# Issues without assignee
scry issue list -q "sprint in openSprints() AND assignee is EMPTY"
```

### Sprint Organization

**Naming Conventions:**

Use consistent naming for easy tracking:

```bash
# Version-aligned
scry sprint create -b 123 -n "v2.0 Sprint 1"

# Quarter-based
scry sprint create -b 123 -n "Q1 2024 - Sprint 3"

# Sequential
scry sprint create -b 123 -n "Sprint 42"
```

**Clear Goals:**

```bash
# Feature-focused
scry sprint create -b 123 -n "Sprint 15" -g "Launch mobile app MVP"

# Technical
scry sprint create -b 123 -n "Sprint 16" -g "Reduce technical debt by 20%"

# Multiple objectives
scry sprint create -b 123 -n "Sprint 17" -g "Complete user profile + fix critical bugs"
```

### Capacity Planning

**Estimate Sprint Size:**

```bash
# Count issues in sprint
scry issue list -q "sprint = 456" -o json | jq '.meta.total'

# List issues by type
scry issue list -q "sprint = 456" -o json | \
  jq -r '.data | group_by(.type) | .[] | "\(.[0].type): \(length) issues"'

# Export for review
scry issue list -q "sprint = 456" --columns key,summary,type,assignee -o csv > sprint-456.csv
```

## Examples

### Complete Sprint Workflow

```bash
# 1. Create new sprint
scry sprint create -b 123 -n "Sprint 20" -g "Improve user onboarding"

# Assuming sprint ID is 456

# 2. Review and add backlog items
scry issue list -q "project = PROJ AND sprint is EMPTY AND status = 'To Do'" \
  --columns key,summary,priority

# 3. Add selected issues to sprint
scry sprint add 456 PROJ-300 PROJ-301 PROJ-302 PROJ-303

# 4. Verify sprint contents
scry issue list -q "sprint = 456"

# 5. Start sprint (done in Jira UI)
# Then monitor with:
scry sprint list --state active

# 6. Track progress during sprint
scry issue list -q "sprint = 456 AND status != Done"

# 7. After sprint, review closed sprint
scry sprint list --state closed
scry issue list -q "sprint = 456"
```

### Sprint Planning Meeting

```bash
#!/bin/bash
# sprint-planning.sh - Prepare for sprint planning

BOARD_ID=123
PROJECT=PROJ

echo "=== Sprint Planning Report ==="
echo ""

# Show active sprint
echo "Current Active Sprint:"
scry sprint list -b $BOARD_ID --state active
echo ""

# Show future sprints
echo "Upcoming Sprints:"
scry sprint list -b $BOARD_ID --state future
echo ""

# Show backlog ready for planning
echo "Ready for Planning (Top 20):"
scry issue list -q "project = $PROJECT AND sprint is EMPTY AND status = 'To Do'" \
  --order-by priority --limit 20
echo ""

# Show unfinished work from current sprint
echo "Unfinished Work (may carry over):"
scry issue list -q "sprint in openSprints() AND status != Done"
```

Usage:
```bash
chmod +x sprint-planning.sh
./sprint-planning.sh
```

### Mid-Sprint Check

```bash
#!/bin/bash
# mid-sprint-check.sh - Check sprint progress

echo "=== Mid-Sprint Status ==="
echo ""

# Sprint info
echo "Active Sprint:"
scry sprint list --state active
echo ""

# Progress breakdown
echo "Issue Status Breakdown:"
scry issue list -q "sprint in openSprints()" -o json | \
  jq -r '.data | group_by(.status) | .[] | "\(.[0].status): \(length) issues"'
echo ""

# In progress issues
echo "Currently In Progress:"
scry issue list -q "sprint in openSprints() AND status = 'In Progress'" \
  --columns key,summary,assignee
echo ""

# Unstarted issues
echo "Not Yet Started:"
scry issue list -q "sprint in openSprints() AND status = 'To Do'" \
  --columns key,summary,assignee
```

### Sprint Retrospective Data

```bash
#!/bin/bash
# sprint-retro.sh - Generate retrospective data

SPRINT_ID=$1

if [ -z "$SPRINT_ID" ]; then
  echo "Usage: $0 <sprint-id>"
  exit 1
fi

echo "=== Sprint $SPRINT_ID Retrospective ==="
echo ""

# Total issues
echo "Total Issues:"
scry issue list -q "sprint = $SPRINT_ID" -o json | jq '.meta.total'
echo ""

# Completed issues
echo "Completed Issues:"
scry issue list -q "sprint = $SPRINT_ID AND status = Done" -o json | jq '.meta.total'
echo ""

# Incomplete issues
echo "Incomplete Issues:"
scry issue list -q "sprint = $SPRINT_ID AND status != Done" -o json | jq '.meta.total'
echo ""

# Issues by type
echo "Issues by Type:"
scry issue list -q "sprint = $SPRINT_ID" -o json | \
  jq -r '.data | group_by(.type) | .[] | "\(.[0].type): \(length)"'
echo ""

# All issues detail
echo "All Issues:"
scry issue list -q "sprint = $SPRINT_ID" --columns key,summary,status,assignee -o csv > "sprint-${SPRINT_ID}-retro.csv"
echo "Exported to sprint-${SPRINT_ID}-retro.csv"
```

Usage:
```bash
chmod +x sprint-retro.sh
./sprint-retro.sh 456
```

### Bulk Sprint Operations

**Move issues between sprints:**

```bash
# Get issues from old sprint
OLD_SPRINT=450
NEW_SPRINT=456

scry issue list -q "sprint = $OLD_SPRINT AND status != Done" -o json | \
  jq -r '.data[].key' | \
  xargs scry sprint add $NEW_SPRINT
```

**Add all epic issues to sprint:**

```bash
EPIC_KEY="EPIC-5"
SPRINT_ID=456

scry issue list -q "Epic = $EPIC_KEY AND status = 'To Do'" -o json | \
  jq -r '.data[].key' | \
  xargs scry sprint add $SPRINT_ID
```

**Add high-priority bugs to sprint:**

```bash
scry issue list -q "type = Bug AND priority = Critical AND sprint is EMPTY" -o json | \
  jq -r '.data[].key' | \
  xargs scry sprint add 456
```

## JQL Queries for Sprint Management

### Sprint-Specific Queries

```bash
# All issues in specific sprint
scry issue list -q "sprint = 456"

# Issues in active sprint
scry issue list -q "sprint in openSprints()"

# Issues in future sprints
scry issue list -q "sprint in futureSprints()"

# Issues not in any sprint
scry issue list -q "sprint is EMPTY"

# Issues that were in a sprint but removed
scry issue list -q "sprint was in (456)"
```

### Sprint Progress Queries

```bash
# Completed work in current sprint
scry issue list -q "sprint in openSprints() AND status = Done"

# Remaining work
scry issue list -q "sprint in openSprints() AND status != Done"

# My work in sprint
scry issue list -q "sprint in openSprints() AND assignee = currentUser()"

# Unassigned issues in sprint
scry issue list -q "sprint in openSprints() AND assignee is EMPTY"
```

### Sprint Planning Queries

```bash
# Backlog ready for sprint
scry issue list -q "project = PROJ AND sprint is EMPTY AND status = 'To Do' ORDER BY priority DESC"

# Recently created issues not in sprint
scry issue list -q "project = PROJ AND sprint is EMPTY AND created >= -7d"

# High priority items without sprint
scry issue list -q "project = PROJ AND sprint is EMPTY AND priority in (High, Critical)"
```

## Working with Boards

### Find Your Board ID

```bash
# List all boards
scry board list

# List scrum boards only
scry board list -t scrum

# Get board ID as JSON
scry board list -o json | jq -r '.data[] | "\(.id): \(.name)"'
```

### Set Default Board

Add to your config file (`~/.config/scry/config.yml`):

```yaml
board:
  id: 123
  type: scrum
```

Then you can omit the `-b` flag:

```bash
# Uses default board from config
scry sprint list
scry sprint create -n "Sprint 20"
```

## Troubleshooting

### Sprint Not Found

**Problem**: Error saying sprint doesn't exist

**Solutions**:
1. Verify sprint ID: `scry sprint list -b 123`
2. Check if board ID is correct: `scry board list`
3. Ensure you have permission to view the board

### Cannot Add Issue to Sprint

**Problem**: Issue won't add to sprint

**Solutions**:
1. Verify the issue exists: `scry issue view PROJ-123`
2. Check if issue is in a project associated with the board
3. Verify the sprint is not closed: `scry sprint list`
4. Ensure you have permission to edit the issue
5. Try adding via Jira UI to see if there's a workflow restriction

### Board ID Unknown

**Problem**: Don't know which board to use

**Solutions**:
1. List all boards: `scry board list`
2. Open Jira in browser and check the board URL (contains board ID)
3. Ask your Jira admin for the board ID

### Sprint Creation Fails

**Problem**: Cannot create sprint

**Solutions**:
1. Verify you have permission to manage sprints on the board
2. Check if board type is Scrum (not Kanban)
3. Ensure board ID is correct: `scry board list`

## Advanced Usage

### Sprint Velocity Tracking

```bash
#!/bin/bash
# sprint-velocity.sh - Track completed work across sprints

for sprint in 450 451 452 453 454; do
  completed=$(scry issue list -q "sprint = $sprint AND status = Done" -o json | jq '.meta.total')
  total=$(scry issue list -q "sprint = $sprint" -o json | jq '.meta.total')
  echo "Sprint $sprint: $completed / $total completed"
done
```

### Automated Sprint Planning

```bash
#!/bin/bash
# auto-plan-sprint.sh - Automatically fill sprint with top priority items

SPRINT_ID=$1
CAPACITY=${2:-20}  # Default to 20 issues

if [ -z "$SPRINT_ID" ]; then
  echo "Usage: $0 <sprint-id> [capacity]"
  exit 1
fi

echo "Planning sprint $SPRINT_ID with capacity of $CAPACITY issues..."

# Get top priority unscheduled issues
ISSUES=$(scry issue list \
  -q "project = PROJ AND sprint is EMPTY AND status = 'To Do' ORDER BY priority DESC" \
  --limit $CAPACITY \
  -o json | jq -r '.data[].key')

# Add to sprint
echo "$ISSUES" | xargs scry sprint add $SPRINT_ID

echo "Sprint planning complete!"
scry issue list -q "sprint = $SPRINT_ID"
```

## Related Documentation

- [Issue Commands](issues.md) - Managing issues
- [Board Commands](projects.md#board-management) - Working with boards
- [Configuration](../configuration.md) - Setting default board
- [Scripting](../scripting.md) - Automating sprint workflows
