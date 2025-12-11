# Epic Add/Remove Commands

This document describes the `scry epic add` and `scry epic remove` commands for managing issue-epic relationships in Jira.

## Overview

These commands allow you to add issues to epics or remove issues from epics by updating the `parent` field on the issue.

## Commands

### `scry epic add`

Add one or more issues to an epic.

**Usage:**
```bash
scry epic add <epic-key> <issue-keys...>
```

**Arguments:**
- `epic-key` - The key of the epic (e.g., `PROJ-100`)
- `issue-keys` - One or more issue keys to add to the epic (e.g., `PROJ-123 PROJ-124 PROJ-125`)

**Options:**
- `--output <format>` - Output format: table (default), json, xml, plain, csv
- `--config <path>` - Path to config file
- `--debug` - Enable debug output

**Examples:**

Add a single issue to an epic:
```bash
scry epic add PROJ-100 PROJ-123
```

Add multiple issues to an epic:
```bash
scry epic add PROJ-100 PROJ-123 PROJ-124 PROJ-125
```

Add issues with JSON output:
```bash
scry epic add PROJ-100 PROJ-123 --output json
```

Add issues with XML output:
```bash
scry epic add PROJ-100 PROJ-123 PROJ-124 --output xml
```

**Output:**

Table format (default):
```
✓ Issue PROJ-123 has been added to epic PROJ-100
```

Or for multiple issues:
```
✓ 3 issues have been added to epic PROJ-100
```

If some issues fail:
```
✓ 2 issues have been added to epic PROJ-100

✗ 1 issue failed:
  PROJ-999: Issue does not exist or you do not have permission to see it
```

JSON format:
```json
{
  "data": {
    "epicKey": "PROJ-100",
    "results": [
      {
        "issueKey": "PROJ-123",
        "success": true,
        "error": null
      },
      {
        "issueKey": "PROJ-124",
        "success": true,
        "error": null
      }
    ]
  }
}
```

XML format:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <data>
    <epicKey>PROJ-100</epicKey>
    <results>
      <result>
        <issueKey>PROJ-123</issueKey>
        <success>true</success>
        <error/>
      </result>
      <result>
        <issueKey>PROJ-124</issueKey>
        <success>true</success>
        <error/>
      </result>
    </results>
  </data>
</root>
```

**Exit codes:**
- `0` - All issues were successfully added to the epic
- `1` - One or more issues failed to be added, or a fatal error occurred

---

### `scry epic remove`

Remove one or more issues from an epic.

**Aliases:** `rm`

**Usage:**
```bash
scry epic remove <epic-key> <issue-keys...>
scry epic rm <epic-key> <issue-keys...>
```

**Arguments:**
- `epic-key` - The key of the epic (e.g., `PROJ-100`) - used for display purposes only
- `issue-keys` - One or more issue keys to remove from the epic (e.g., `PROJ-123 PROJ-124 PROJ-125`)

**Options:**
- `--output <format>` - Output format: table (default), json, xml, plain, csv
- `--config <path>` - Path to config file
- `--debug` - Enable debug output

**Examples:**

Remove a single issue from an epic:
```bash
scry epic remove PROJ-100 PROJ-123
```

Remove multiple issues from an epic (using alias):
```bash
scry epic rm PROJ-100 PROJ-123 PROJ-124 PROJ-125
```

Remove issues with JSON output:
```bash
scry epic remove PROJ-100 PROJ-123 --output json
```

**Output:**

Table format (default):
```
✓ Issue PROJ-123 has been removed from epic PROJ-100
```

Or for multiple issues:
```
✓ 3 issues have been removed from epic PROJ-100
```

If some issues fail:
```
✓ 2 issues have been removed from epic PROJ-100

✗ 1 issue failed:
  PROJ-999: Issue does not exist or you do not have permission to see it
```

JSON format:
```json
{
  "data": {
    "epicKey": "PROJ-100",
    "results": [
      {
        "issueKey": "PROJ-123",
        "success": true,
        "error": null
      },
      {
        "issueKey": "PROJ-124",
        "success": true,
        "error": null
      }
    ]
  }
}
```

**Exit codes:**
- `0` - All issues were successfully removed from the epic
- `1` - One or more issues failed to be removed, or a fatal error occurred

---

## Implementation Details

### How It Works

**Adding issues to an epic:**
- The command updates the `parent` field on each issue to point to the epic
- Uses the Jira REST API endpoint: `PUT /rest/api/3/issue/{issueKey}`
- Request body: `{ "fields": { "parent": { "key": "EPIC-KEY" } } }`

**Removing issues from an epic:**
- The command updates the `parent` field on each issue to `null`
- Uses the Jira REST API endpoint: `PUT /rest/api/3/issue/{issueKey}`
- Request body: `{ "fields": { "parent": null } }`

### Batch Processing

Both commands process issues sequentially and report individual results for each issue. This allows for partial success scenarios where some issues succeed and others fail.

### Error Handling

The commands handle errors gracefully:
- If an issue doesn't exist, the command reports the error but continues processing other issues
- If you don't have permission to update an issue, the command reports the error but continues
- If all issues fail, the command exits with code 1
- If at least one issue succeeds but some fail, the command exits with code 1 but reports which ones succeeded

### Output Formats

All standard Scry output formats are supported:
- **table** (default) - Human-readable table format with colored output
- **plain** - Plain text output without colors
- **json** - Structured JSON output for programmatic consumption
- **xml** - XML output for legacy systems
- **csv** - CSV output (fields: epicKey, issueKey, success, error)

### Type Safety

The implementation uses TypeScript's type system to ensure:
- The `parent` field accepts either `{ key: string }` or `null`
- All API responses are properly typed
- Output structures are consistent across all commands

## Testing

The implementation includes:
- **30 unit tests** covering individual functionality and edge cases
- **9 integration tests** validating API request structures and response handling
- **100% test coverage** for the core logic

Run the tests:
```bash
bun test tests/unit/cli/commands/epic/
bun test tests/integration/epic-add-remove.test.ts
```

## Related Commands

- `scry epic list` - List epics in a project
- `scry epic create` - Create a new epic
- `scry issue view` - View issue details including parent epic
- `scry issue edit` - Edit issue fields including parent

## API Reference

For more information about the Jira REST API endpoints used:
- [Update Issue](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put)
- [Issue Fields](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-fields/)
