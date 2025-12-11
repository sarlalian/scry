# Epic Commands

Complete guide to managing Jira Epics with Scry.

## Table of Contents

- [Overview](#overview)
- [Listing Epics](#listing-epics)
- [Creating Epics](#creating-epics)
- [Adding Issues to Epics](#adding-issues-to-epics)
- [Removing Issues from Epics](#removing-issues-from-epics)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Epics are large user stories or features that can be broken down into smaller issues. They help organize work and provide a high-level view of project progress.

In Jira, an epic is a special issue type that can have child issues associated with it. Scry provides dedicated commands for managing epics and their relationships with other issues.

## Listing Epics

### Basic Usage

List all epics in your default project:

```bash
scry epic list
# or use the alias
scry epic ls
```

This displays:
- Epic key
- Epic name/summary
- Status
- Progress (number of issues)

### List Epics in Specific Project

```bash
scry epic list -p PROJ
```

### Output Formats

```bash
# Table format (default, human-readable)
scry epic list

# Plain text without colors
scry epic list -o plain

# JSON format for scripting
scry epic list -o json

# CSV format for spreadsheets
scry epic list -o csv > epics.csv

# XML format
scry epic list -o xml
```

### Filtering Epics

Since epics are issues, you can use the issue list command with type filter:

```bash
# List all epics with JQL
scry issue list -t Epic

# List epics by status
scry issue list -t Epic -s "In Progress"

# List epics assigned to you
scry issue list -t Epic -a currentUser()

# List epics with specific labels
scry issue list -t Epic -l Q1 -l priority

# Complex epic query with JQL
scry issue list -q "type = Epic AND status != Done ORDER BY created DESC"
```

### Viewing Epic Details

View detailed information about an epic:

```bash
scry issue view EPIC-123
```

This shows:
- Epic summary and description
- Status and assignee
- All child issues
- Progress metrics
- Labels and components

## Creating Epics

### Interactive Creation

Launch the interactive epic creation wizard:

```bash
scry epic create
```

The wizard prompts for:
1. Project key (if not set as default)
2. Epic name/summary
3. Epic description (optional)
4. Additional fields (labels, assignee, etc.)

### Quick Creation with Flags

Create an epic with all details in one command:

```bash
scry epic create \
  -p PROJ \
  -s "User Authentication System" \
  -d "Implement complete authentication with OAuth, JWT, and password reset"
```

### Creation Options

| Option | Description | Example |
|--------|-------------|---------|
| `-p, --project` | Project key | `-p PROJ` |
| `-s, --summary` | Epic name/summary | `-s "Epic name"` |
| `-d, --description` | Epic description | `-d "Detailed description"` |

### Create Epic with Labels

```bash
scry epic create \
  -p PROJ \
  -s "API Improvements" \
  -d "Refactor and optimize API endpoints" \
  -l backend -l performance
```

Note: To add labels, you'll need to use the issue create command with epic type:

```bash
scry issue create \
  -p PROJ \
  -t Epic \
  -s "API Improvements" \
  -d "Refactor and optimize API endpoints" \
  -l backend -l performance
```

### Tips

- Epic names should be descriptive and high-level
- Include clear acceptance criteria in the description
- Use labels to categorize epics (e.g., by quarter, team, or priority)
- Epics can be assigned to track ownership

## Adding Issues to Epics

Link existing issues to an epic.

### Add Single Issue

```bash
scry epic add EPIC-1 PROJ-123
```

### Add Multiple Issues

Add multiple issues to an epic in one command:

```bash
scry epic add EPIC-1 PROJ-123 PROJ-124 PROJ-125
```

### Response

The command displays the result for each issue:
- Success or failure status
- Issue key
- Epic key
- Confirmation message

### Output Formats

```bash
# Table format (default)
scry epic add EPIC-1 PROJ-123 PROJ-124

# JSON format
scry epic add EPIC-1 PROJ-123 -o json

# Plain text
scry epic add EPIC-1 PROJ-123 -o plain
```

### What Happens

When you add issues to an epic:
1. The issue's epic field is updated
2. The issue appears under the epic in Jira
3. Epic progress is updated automatically
4. The epic link appears in the issue details

### Common Use Cases

**Add all issues from a query:**

```bash
# Get issue keys and add to epic
scry issue list -t Story -l mvp -o json | jq -r '.data[].key' | xargs scry epic add EPIC-1
```

**Add newly created issues:**

```bash
# Create issue and add to epic
NEW_KEY=$(scry issue create -p PROJ -t Story -s "New story" -o json | jq -r '.data.key')
scry epic add EPIC-1 $NEW_KEY
```

### Tips

- Issues must be in the same project as the epic
- You need permission to edit both the epic and the issues
- Subtasks inherit their parent's epic automatically
- An issue can only belong to one epic at a time

## Removing Issues from Epics

Unlink issues from an epic.

### Remove Single Issue

```bash
scry epic remove EPIC-1 PROJ-123
```

### Remove Multiple Issues

Remove multiple issues from an epic in one command:

```bash
scry epic remove EPIC-1 PROJ-123 PROJ-124 PROJ-125
```

### Response

The command displays the result for each issue:
- Success or failure status
- Issue key
- Epic key
- Confirmation message

### Output Formats

```bash
# Table format (default)
scry epic remove EPIC-1 PROJ-123 PROJ-124

# JSON format
scry epic remove EPIC-1 PROJ-123 -o json

# Plain text
scry epic remove EPIC-1 PROJ-123 -o plain
```

### What Happens

When you remove issues from an epic:
1. The issue's epic field is cleared
2. The issue no longer appears under the epic
3. Epic progress is updated automatically
4. The issue remains otherwise unchanged

### Common Use Cases

**Remove completed issues:**

```bash
# Get completed issues in epic and remove them
scry issue list -q "Epic = EPIC-1 AND status = Done" -o json | jq -r '.data[].key' | xargs scry epic remove EPIC-1
```

**Move issues to different epic:**

```bash
# Remove from old epic
scry epic remove OLD-EPIC PROJ-123

# Add to new epic
scry epic add NEW-EPIC PROJ-123
```

### Tips

- Removing an issue from an epic doesn't delete the issue
- You need permission to edit both the epic and the issues
- Consider moving issues to a different epic instead of just removing them

## Best Practices

### Epic Organization

1. **Clear Naming**: Use descriptive epic names that clearly communicate the goal
   ```bash
   scry epic create -p PROJ -s "Mobile App: User Profile Management"
   ```

2. **Size Appropriately**: Epics should be large enough to warrant breakdown but not so large they span multiple releases

3. **Use Labels**: Tag epics by quarter, team, or theme
   ```bash
   scry issue create -p PROJ -t Epic -s "API v2 Migration" -l Q2 -l backend
   ```

4. **Assign Ownership**: Assign epics to technical leads or product owners
   ```bash
   scry issue assign EPIC-1 tech.lead@example.com
   ```

### Planning with Epics

1. **Create Epic First**: Start with the epic before creating child issues
   ```bash
   scry epic create -p PROJ -s "Payment Integration"
   ```

2. **Break Down Work**: Create issues for each component
   ```bash
   scry issue create -p PROJ -t Story -s "Integrate Stripe API"
   scry issue create -p PROJ -t Story -s "Add payment form UI"
   scry issue create -p PROJ -t Story -s "Handle webhooks"
   ```

3. **Link Issues to Epic**: Add all related issues
   ```bash
   scry epic add EPIC-1 PROJ-123 PROJ-124 PROJ-125
   ```

4. **Track Progress**: Monitor epic completion
   ```bash
   scry issue view EPIC-1
   ```

### Epic Lifecycle

**Creation:**
```bash
# Create epic with full details
scry epic create \
  -p PROJ \
  -s "Customer Dashboard Redesign" \
  -d "Modernize the customer dashboard with improved UX and performance"
```

**Planning:**
```bash
# Add planned work
scry epic add EPIC-1 PROJ-200 PROJ-201 PROJ-202

# View progress
scry issue view EPIC-1
```

**Execution:**
```bash
# Start the epic
scry issue move EPIC-1 "In Progress"

# Track issues
scry issue list -q "Epic = EPIC-1 AND status = 'In Progress'"
```

**Completion:**
```bash
# Verify all issues done
scry issue list -q "Epic = EPIC-1 AND status != Done"

# Close the epic
scry issue move EPIC-1 Done
```

### Reporting

**Epic Progress:**
```bash
# All issues in epic
scry issue list -q "Epic = EPIC-1"

# Open issues in epic
scry issue list -q "Epic = EPIC-1 AND status != Done"

# Completed issues in epic
scry issue list -q "Epic = EPIC-1 AND status = Done"
```

**Multiple Epics:**
```bash
# All epics in progress
scry issue list -t Epic -s "In Progress"

# Epics by label
scry issue list -t Epic -l Q1
```

**Export for Reporting:**
```bash
# Export epic details
scry issue view EPIC-1 -o json > epic-1-details.json

# Export all issues in epic
scry issue list -q "Epic = EPIC-1" -o csv > epic-1-issues.csv
```

## Examples

### Complete Epic Workflow

```bash
# 1. Create an epic
scry epic create \
  -p PROJ \
  -s "Multi-factor Authentication" \
  -d "Add 2FA support with SMS and authenticator apps"

# Assuming epic key is EPIC-5

# 2. Create related stories
scry issue create -p PROJ -t Story -s "Implement TOTP authentication"
scry issue create -p PROJ -t Story -s "Add SMS verification"
scry issue create -p PROJ -t Story -s "Build 2FA settings UI"

# Assuming story keys are PROJ-100, PROJ-101, PROJ-102

# 3. Add stories to epic
scry epic add EPIC-5 PROJ-100 PROJ-101 PROJ-102

# 4. Start working on epic
scry issue move EPIC-5 "In Progress"

# 5. Check progress anytime
scry issue view EPIC-5

# 6. When done, complete the epic
scry issue move EPIC-5 Done
```

### Managing Epic Scope

```bash
# View all issues in epic
scry issue list -q "Epic = EPIC-5"

# Add new issue to scope
scry issue create -p PROJ -t Task -s "Update documentation for 2FA"
scry epic add EPIC-5 PROJ-103

# Remove issue from scope
scry epic remove EPIC-5 PROJ-103

# Move issue to different epic
scry epic remove OLD-EPIC PROJ-104
scry epic add NEW-EPIC PROJ-104
```

### Epic Reporting Script

```bash
#!/bin/bash
# epic-report.sh - Generate epic progress report

EPIC_KEY=$1

echo "Epic Report: $EPIC_KEY"
echo "====================="

# Epic details
scry issue view $EPIC_KEY -o json | jq -r '.data | "Name: \(.fields.summary)\nStatus: \(.fields.status.name)"'

echo ""
echo "Issue Breakdown:"
echo "----------------"

# Count by status
scry issue list -q "Epic = $EPIC_KEY" -o json | \
  jq -r '.data | group_by(.status) | .[] | "\(.[0].status): \(length) issues"'

echo ""
echo "Open Issues:"
echo "------------"

# List open issues
scry issue list -q "Epic = $EPIC_KEY AND status != Done" --columns key,summary,status
```

Usage:
```bash
chmod +x epic-report.sh
./epic-report.sh EPIC-5
```

### Bulk Operations

**Add all unassigned stories to epic:**
```bash
scry issue list -t Story -a x -o json | \
  jq -r '.data[].key' | \
  xargs scry epic add EPIC-5
```

**Remove completed issues from epic:**
```bash
scry issue list -q "Epic = EPIC-5 AND status = Done" -o json | \
  jq -r '.data[].key' | \
  xargs scry epic remove EPIC-5
```

**Copy issues to different epic:**
```bash
# Get issues from source epic
ISSUES=$(scry issue list -q "Epic = SOURCE-EPIC" -o json | jq -r '.data[].key')

# Clone and add to target epic
for issue in $ISSUES; do
  NEW_KEY=$(scry issue clone $issue -o json | jq -r '.data.key')
  scry epic add TARGET-EPIC $NEW_KEY
done
```

## Common Workflows

### Sprint Planning with Epics

```bash
# List epics for next sprint
scry issue list -t Epic -s "To Do" -l next-sprint

# View epic details to understand scope
scry issue view EPIC-10

# Get issues from epic
scry issue list -q "Epic = EPIC-10 AND status = 'To Do'"

# Add selected issues to sprint
scry sprint add 456 PROJ-200 PROJ-201
```

### Epic Progress Tracking

```bash
# Daily epic check
scry issue list -q "Epic = EPIC-10 AND status = 'In Progress'"

# Epic completion percentage (manual calculation)
TOTAL=$(scry issue list -q "Epic = EPIC-10" -o json | jq '.meta.total')
DONE=$(scry issue list -q "Epic = EPIC-10 AND status = Done" -o json | jq '.meta.total')
echo "Progress: $DONE / $TOTAL issues complete"
```

### Epic Cleanup

```bash
# Find epics with no issues
scry issue list -t Epic -o json | \
  jq -r '.data[].key' | \
  while read epic; do
    count=$(scry issue list -q "Epic = $epic" -o json | jq '.meta.total')
    if [ "$count" -eq 0 ]; then
      echo "Empty epic: $epic"
    fi
  done
```

## Troubleshooting

### Issue Won't Add to Epic

**Problem**: Error when adding issue to epic

**Solutions**:
1. Verify the epic exists: `scry issue view EPIC-1`
2. Verify the issue exists: `scry issue view PROJ-123`
3. Check if issue is in same project as epic
4. Verify you have edit permission on both issues
5. Check if the issue already belongs to a different epic

### Epic Not Showing Progress

**Problem**: Epic doesn't show correct issue count

**Solutions**:
1. Verify issues are properly linked: `scry issue list -q "Epic = EPIC-1"`
2. Refresh by viewing the epic: `scry issue view EPIC-1`
3. Check Jira directly - may be a sync issue

### Cannot Remove Issue from Epic

**Problem**: Issue won't unlink from epic

**Solutions**:
1. Verify you have permission to edit the issue
2. Try removing via issue edit instead
3. Check if the issue is a subtask (remove parent first)

## Related Documentation

- [Issue Commands](issues.md) - General issue management
- [Sprint Commands](sprints.md) - Managing sprints
- [Configuration](../configuration.md) - Configuration options
- [Scripting](../scripting.md) - Automation with epics
