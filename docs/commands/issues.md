# Issue Commands

Complete guide to managing Jira issues with Scry.

## Table of Contents

- [Listing Issues](#listing-issues)
- [Viewing Issues](#viewing-issues)
- [Creating Issues](#creating-issues)
- [Editing Issues](#editing-issues)
- [Moving Issues (Transitions)](#moving-issues-transitions)
- [Assigning Issues](#assigning-issues)
- [Commenting on Issues](#commenting-on-issues)
- [Cloning Issues](#cloning-issues)
- [Deleting Issues](#deleting-issues)
- [Managing Worklogs](#managing-worklogs)
- [Linking Issues](#linking-issues)
- [Unlinking Issues](#unlinking-issues)

## Listing Issues

### Basic Usage

```bash
scry issue list
# or use the alias
scry issue ls
```

This displays issues from your default project in a table format.

### Filtering Options

#### Filter by Assignee

```bash
# Issues assigned to a specific user
scry issue list -a john.doe@example.com

# Issues assigned to you
scry issue list -a currentUser()

# Unassigned issues
scry issue list -a x
```

#### Filter by Reporter

```bash
scry issue list -r jane.smith@example.com
```

#### Filter by Status

```bash
# Issues with specific status
scry issue list -s "In Progress"

# Exclude a status (using ~ prefix)
scry issue list -s "~Done"
```

#### Filter by Issue Type

```bash
scry issue list -t Bug
scry issue list -t Story
scry issue list -t Task
```

#### Filter by Priority

```bash
scry issue list -y High
scry issue list -y Critical
scry issue list -y Medium
```

#### Filter by Labels

You can specify multiple labels by using the `-l` flag multiple times:

```bash
scry issue list -l urgent
scry issue list -l backend -l api
```

#### Filter by Component

```bash
scry issue list -C "Frontend"
scry issue list -C "API"
```

#### Filter by Watching

Show only issues you're watching:

```bash
scry issue list -w
```

### Date Filters

#### Filter by Created Date

```bash
# Issues created in the last 7 days
scry issue list --created -7d

# Issues created this week
scry issue list --created week

# Issues created this month
scry issue list --created month

# Issues created in the last 30 days
scry issue list --created -30d
```

#### Filter by Updated Date

```bash
# Issues updated in the last 3 days
scry issue list --updated -3d

# Issues updated this week
scry issue list --updated week
```

### Sorting and Limiting

#### Sort Results

```bash
# Sort by created date (default, descending)
scry issue list

# Sort by updated date
scry issue list --order-by updated

# Sort by priority
scry issue list --order-by priority

# Reverse sort order (ascending)
scry issue list --order-by created --reverse
```

#### Limit Results

```bash
# Get first 10 issues
scry issue list --limit 10

# Get first 100 issues
scry issue list --limit 100
```

### Custom Columns

Display specific columns:

```bash
scry issue list --columns key,summary,status,assignee
scry issue list --columns key,summary,priority,type
```

Available columns: `key`, `summary`, `status`, `assignee`, `priority`, `type`

### Raw JQL Queries

For complex queries, use JQL directly:

```bash
# Your open bugs
scry issue list -q "assignee = currentUser() AND type = Bug AND status != Done"

# Issues updated in last 2 weeks
scry issue list -q "updated >= -2w ORDER BY updated DESC"

# Complex sprint query
scry issue list -q "project = PROJ AND sprint in openSprints() AND status = 'In Progress'"

# Issues with multiple conditions
scry issue list -q "project = PROJ AND priority in (High, Critical) AND labels = urgent"
```

### Combined Filters

Combine multiple filters for precise results:

```bash
# Your high-priority bugs in progress
scry issue list -a currentUser() -t Bug -y High -s "In Progress"

# Unassigned stories with labels
scry issue list -a x -t Story -l backend -l api

# Issues created this week with specific status
scry issue list --created week -s "To Do" --limit 20
```

### Output Formats

```bash
# Default table format
scry issue list

# Plain text without colors
scry issue list -o plain

# JSON for scripting
scry issue list -o json

# CSV for spreadsheets
scry issue list -o csv > issues.csv

# XML format
scry issue list -o xml
```

## Viewing Issues

### Basic View

View detailed information about a specific issue:

```bash
scry issue view PROJ-123
```

This displays:
- Issue key and summary
- Status, priority, and type
- Assignee and reporter
- Description
- Labels and components
- Dates (created, updated, due date)
- Comments
- Links to other issues
- Subtasks

### Output Formats

```bash
# Table format (default, human-readable)
scry issue view PROJ-123

# JSON format (for processing)
scry issue view PROJ-123 -o json

# XML format
scry issue view PROJ-123 -o xml
```

## Creating Issues

### Interactive Mode

Launch interactive creation wizard:

```bash
scry issue create
# or use the alias
scry issue new
```

The wizard prompts for:
1. Project key
2. Issue type (Task, Bug, Story, Epic, Subtask)
3. Summary (required)
4. Description (optional, can use editor)
5. Priority (optional)
6. Assignee (optional)
7. Labels (optional)
8. Components (optional)
9. Parent issue (for subtasks)

### Quick Creation with Flags

Create an issue with all details in one command:

```bash
scry issue create \
  -p PROJ \
  -t Task \
  -s "Implement user authentication" \
  -d "Add JWT-based authentication to the API" \
  -y High \
  -l backend -l security
```

### Common Creation Patterns

#### Create a Bug

```bash
scry issue create \
  -p PROJ \
  -t Bug \
  -s "Login page returns 500 error" \
  -d "Users cannot log in when username contains special characters" \
  -y Critical \
  -l production
```

#### Create a Story

```bash
scry issue create \
  -p PROJ \
  -t Story \
  -s "As a user, I want to reset my password" \
  -d "Add forgot password functionality to the login page"
```

#### Create a Task

```bash
scry issue create \
  -p PROJ \
  -t Task \
  -s "Update deployment documentation"
```

#### Create a Subtask

```bash
scry issue create \
  -p PROJ \
  -t Sub-task \
  -P PROJ-123 \
  -s "Write unit tests for authentication module"
```

### Creation Options

| Option | Description | Example |
|--------|-------------|---------|
| `-p, --project` | Project key | `-p PROJ` |
| `-t, --type` | Issue type | `-t Bug` |
| `-s, --summary` | Issue summary | `-s "Fix bug"` |
| `-d, --description` | Issue description | `-d "Details..."` |
| `-a, --assignee` | Assignee account ID | `-a user@example.com` |
| `-y, --priority` | Priority | `-y High` |
| `-l, --labels` | Comma-separated labels | `-l urgent,backend` |
| `-C, --components` | Comma-separated components | `-C "Frontend,API"` |
| `-P, --parent` | Parent issue key | `-P PROJ-100` |
| `-i, --interactive` | Force interactive mode | `-i` |

### Tips

- Use `-i` to enter interactive mode even when flags are provided
- Assignee must be a valid Jira account ID or email
- Priority and type names are case-sensitive
- Labels are created automatically if they don't exist

## Editing Issues

### Interactive Editing

```bash
scry issue edit PROJ-123
```

This opens an interactive prompt allowing you to update fields.

### Update Specific Fields

```bash
# Update summary
scry issue edit PROJ-123 -s "Updated summary text"

# Update description
scry issue edit PROJ-123 -d "New description"

# Update priority
scry issue edit PROJ-123 -y Medium

# Add labels (comma-separated)
scry issue edit PROJ-123 -l new-label,another-label

# Set components
scry issue edit PROJ-123 -C "Backend,API"

# Multiple fields at once
scry issue edit PROJ-123 -s "New summary" -y High -l urgent
```

### Editing Options

| Option | Description | Example |
|--------|-------------|---------|
| `-s, --summary` | Update summary | `-s "New title"` |
| `-d, --description` | Update description | `-d "Updated details"` |
| `-y, --priority` | Update priority | `-y Low` |
| `-l, --labels` | Set labels | `-l label1,label2` |
| `-C, --components` | Set components | `-C "Frontend"` |

Note: Edit replaces the current values with new ones. It doesn't append to existing values.

## Moving Issues (Transitions)

Move issues through your workflow by transitioning them to different statuses.

### Interactive Transition

View available transitions and select one:

```bash
scry issue move PROJ-123
```

This displays all valid transitions for the issue and lets you choose.

### Direct Transition

Transition directly to a status:

```bash
# Move to "In Progress"
scry issue move PROJ-123 "In Progress"

# Move to "Done"
scry issue move PROJ-123 Done

# Move to "Code Review"
scry issue move PROJ-123 "Code Review"
```

### Common Workflows

**Start Work:**
```bash
scry issue move PROJ-123 "In Progress"
```

**Submit for Review:**
```bash
scry issue move PROJ-123 "Code Review"
```

**Complete Issue:**
```bash
scry issue move PROJ-123 Done
```

**Reopen Issue:**
```bash
scry issue move PROJ-123 "To Do"
```

### Tips

- Transition names must match exactly (case-sensitive)
- Available transitions depend on your workflow configuration
- Some transitions may require additional fields (use interactive mode)
- Use `scry issue view PROJ-123` to see current status

## Assigning Issues

### Assign to User

```bash
scry issue assign PROJ-123 john.doe@example.com
```

### Assign to Yourself

```bash
scry issue assign PROJ-123 currentUser()
```

### Unassign Issue

```bash
scry issue assign PROJ-123 x
```

### Tips

- User must have permission to be assigned issues in the project
- Use email addresses or Jira account IDs
- `x` is a special value meaning "unassigned"
- `currentUser()` assigns to the authenticated user

## Commenting on Issues

### Add Comment Interactively

```bash
scry issue comment add PROJ-123
```

This prompts you to enter a comment.

### Add Comment Directly

```bash
scry issue comment add PROJ-123 "This is my comment"
```

### Use Text Editor

Open your default editor to write a longer comment:

```bash
scry issue comment add PROJ-123 -e
```

### Add Comment with Flag

```bash
scry issue comment add PROJ-123 -b "Comment text here"
```

### Multi-line Comments

Using quotes, you can add multi-line comments:

```bash
scry issue comment add PROJ-123 "Line 1
Line 2
Line 3"
```

### Comment Options

| Option | Description | Example |
|--------|-------------|---------|
| `-b, --body` | Comment text | `-b "Comment text"` |
| `-e, --editor` | Use editor | `-e` |

### Tips

- Comments support Jira markdown formatting
- Use `-e` for longer, formatted comments
- Comments are added to the issue immediately
- All users with view access can see comments

## Cloning Issues

Create a copy of an existing issue.

### Interactive Clone

```bash
scry issue clone PROJ-123
```

This prompts for new summary and other fields.

### Clone with New Summary

```bash
scry issue clone PROJ-123 -s "Cloned: Original issue title"
```

### Clone to Different Project

```bash
scry issue clone PROJ-123 -p NEWPROJ
```

### Clone with Multiple Changes

```bash
scry issue clone PROJ-123 \
  -s "New title for clone" \
  -p NEWPROJ \
  -a different.user@example.com
```

### Clone Options

| Option | Description | Example |
|--------|-------------|---------|
| `-s, --summary` | New summary | `-s "Cloned issue"` |
| `-p, --project` | Target project | `-p NEWPROJ` |
| `-a, --assignee` | New assignee | `-a user@example.com` |

### What Gets Cloned

- Summary (can be overridden)
- Description
- Issue type
- Priority
- Labels
- Components

### What Doesn't Get Cloned

- Comments
- Worklogs
- Issue links
- Attachments
- Status (clones start as "To Do")

## Deleting Issues

Permanently delete issues (cannot be undone).

### Delete Single Issue

```bash
scry issue delete PROJ-123
```

You'll be prompted for confirmation.

### Delete Multiple Issues

```bash
scry issue delete PROJ-123 PROJ-124 PROJ-125
```

### Skip Confirmation

```bash
scry issue delete PROJ-123 -y
# or
scry issue delete PROJ-123 --yes
```

### Warning

- Deletion is permanent and cannot be undone
- You must have delete permission for the issue
- Consider transitioning to "Won't Do" instead of deleting
- All issue data (comments, worklogs, links) will be lost

## Managing Worklogs

Track time spent working on issues.

### Add Worklog Interactively

```bash
scry issue worklog add PROJ-123
```

### Add Worklog with Time

```bash
scry issue worklog add PROJ-123 -t 2h
scry issue worklog add PROJ-123 -t 30m
scry issue worklog add PROJ-123 -t 1d
scry issue worklog add PROJ-123 -t 1w
```

### Time Format

Combine different units:

```bash
scry issue worklog add PROJ-123 -t 1d4h30m
scry issue worklog add PROJ-123 -t 2h15m
```

Supported units:
- `w` - weeks
- `d` - days
- `h` - hours
- `m` - minutes

### Add Worklog with Comment

```bash
scry issue worklog add PROJ-123 -t 2h -c "Implemented authentication"
```

### Specify Start Time

```bash
scry issue worklog add PROJ-123 -t 3h -s "2024-01-15T09:00:00"
```

Use ISO 8601 format for start time.

### Worklog Options

| Option | Description | Example |
|--------|-------------|---------|
| `-t, --time` | Time spent | `-t 2h30m` |
| `-c, --comment` | Worklog comment | `-c "Fixed bug"` |
| `-s, --started` | Start time | `-s "2024-01-15T09:00:00"` |

### Tips

- Worklogs are useful for time tracking and reporting
- Time must be specified in Jira format (w/d/h/m)
- Start time defaults to now if not specified
- Comments are optional but recommended

## Linking Issues

Create relationships between issues.

### View Available Link Types

```bash
scry issue link PROJ-123 PROJ-456
```

Running without `--type` shows available link types.

### Link with Type

```bash
scry issue link PROJ-123 PROJ-456 --type Blocks
scry issue link PROJ-123 PROJ-456 --type Relates
scry issue link PROJ-123 PROJ-456 --type Duplicates
scry issue link PROJ-123 PROJ-456 --type "Cloners"
```

### Common Link Types

| Link Type | Outward | Inward |
|-----------|---------|--------|
| Blocks | blocks | is blocked by |
| Relates | relates to | relates to |
| Duplicates | duplicates | is duplicated by |
| Cloners | is cloned by | clones |

### Examples

```bash
# PROJ-123 blocks PROJ-456
scry issue link PROJ-123 PROJ-456 --type Blocks

# PROJ-123 relates to PROJ-456
scry issue link PROJ-123 PROJ-456 --type Relates

# PROJ-123 duplicates PROJ-456
scry issue link PROJ-123 PROJ-456 --type Duplicates
```

### Tips

- Link types are case-sensitive
- Both issues must exist
- You cannot link an issue to itself
- Links are bidirectional

## Unlinking Issues

Remove links between issues.

### View Available Links

```bash
scry issue view PROJ-123
```

This shows all current links.

### Unlink Issues

```bash
scry issue unlink PROJ-123 PROJ-456
```

This removes all links between the two issues.

### Tips

- All link types between the two issues are removed
- Both issues must exist
- You need permission to modify both issues

## Best Practices

### Filtering

1. Use JQL for complex queries
2. Combine filters for precise results
3. Use `--limit` to manage large result sets
4. Save common queries as shell aliases

### Creating Issues

1. Use templates for common issue types
2. Add labels for better organization
3. Set appropriate priorities
4. Link related issues

### Workflow

1. Keep issues up-to-date with comments
2. Log time with worklogs
3. Transition issues promptly
4. Link related issues for context

### Automation

1. Use JSON output for scripting
2. Create shell scripts for repetitive tasks
3. Use environment variables for configuration
4. Integrate with CI/CD pipelines

## Examples

### Daily Workflow

```bash
# Check your assigned tasks
scry issue list -a currentUser() -s "~Done"

# Start working on an issue
scry issue assign PROJ-123 currentUser()
scry issue move PROJ-123 "In Progress"

# Add progress comment
scry issue comment add PROJ-123 "Working on implementation"

# Log time
scry issue worklog add PROJ-123 -t 2h -c "Initial implementation"

# Complete the issue
scry issue move PROJ-123 Done
```

### Bug Triage

```bash
# List recent bugs
scry issue list -t Bug --created -7d

# Assign bug
scry issue assign PROJ-456 john.doe@example.com

# Set priority
scry issue edit PROJ-456 -y Critical

# Add triage comment
scry issue comment add PROJ-456 "Confirmed - affects production users"
```

### Sprint Planning

```bash
# List unassigned stories
scry issue list -t Story -a x -s "To Do"

# View story details
scry issue view PROJ-789

# Assign story
scry issue assign PROJ-789 currentUser()

# Add to sprint (see Sprint Commands documentation)
scry sprint add 123 PROJ-789
```

## Related Documentation

- [Getting Started](../getting-started.md) - Installation and setup
- [Epic Commands](epics.md) - Managing epics
- [Sprint Commands](sprints.md) - Managing sprints
- [Configuration](../configuration.md) - Configuration options
- [Scripting](../scripting.md) - Automation and integration
