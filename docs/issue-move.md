# Issue Move Command

The `scry issue move` command allows you to move Jira issues through workflow transitions (e.g., from "To Do" to "In Progress" to "Done").

## Usage

```bash
scry issue move <issue-key> [target-status] [options]
```

### Aliases

- `scry issue transition` (alias for `move`)

## Arguments

- `<issue-key>` - The issue key (e.g., PROJ-123) - **Required**
- `[target-status]` - The target status or transition name (optional)

## Options

- `-i, --interactive` - Select transition interactively from a list
- `-o, --output <format>` - Output format: table, plain, json, xml, csv (default: table)

## Examples

### List available transitions

Show all available transitions for an issue:

```bash
scry issue move PROJ-123
```

Output:
```
Available transitions for PROJ-123:

┌────┬────────────────┬─────────────┬───────────┐
│ ID │ Transition     │ To Status   │ Available │
├────┼────────────────┼─────────────┼───────────┤
│ 11 │ To Do          │ To Do       │ Yes       │
│ 21 │ In Progress    │ In Progress │ Yes       │
│ 31 │ Done           │ Done        │ Yes       │
└────┴────────────────┴─────────────┴───────────┘

Use: scry issue move PROJ-123 <status> to transition the issue
```

### Move issue to specific status

Move an issue directly to a specific status:

```bash
scry issue move PROJ-123 "In Progress"
```

Output:
```
✓ Successfully moved PROJ-123 to In Progress
```

Case-insensitive matching:
```bash
scry issue move PROJ-123 "in progress"
scry issue move PROJ-123 "IN PROGRESS"
```

### Interactive mode

Select transition from an interactive list:

```bash
scry issue move PROJ-123 --interactive
```

You'll be prompted to select from available transitions:
```
? Select transition for PROJ-123:
  To Do → To Do (To Do)
❯ In Progress → In Progress (In Progress)
  Done → Done (Done)
```

### JSON output

Get transitions in JSON format for scripting:

```bash
scry issue move PROJ-123 --output json
```

Output:
```json
{
  "data": [
    {
      "id": "11",
      "name": "To Do",
      "to": {
        "id": "1",
        "name": "To Do",
        "statusCategory": {
          "id": 2,
          "key": "new",
          "name": "To Do",
          "colorName": "blue-gray"
        }
      },
      "hasScreen": false,
      "isAvailable": true
    },
    ...
  ]
}
```

### XML output

Get transitions in XML format:

```bash
scry issue move PROJ-123 --output xml
```

## Workflow

The command interacts with the Jira REST API:

1. **GET** `/rest/api/3/issue/{key}/transitions` - Fetches available transitions
2. Displays transitions (if no target status provided)
3. Finds matching transition by status name (case-insensitive)
4. **POST** `/rest/api/3/issue/{key}/transitions` - Executes the transition

## Features

- **Case-insensitive matching** - Matches status names regardless of case
- **Interactive selection** - Choose from available transitions with arrow keys
- **Multiple output formats** - Table, plain, JSON, XML, CSV
- **Validation** - Only shows available transitions, prevents invalid moves
- **Clear feedback** - Color-coded success/error messages

## Error Handling

### No transitions available

If an issue has no available transitions:
```bash
scry issue move PROJ-123
```
Output:
```
No transitions available for PROJ-123
```

### Invalid status name

If the target status doesn't match any transitions:
```bash
scry issue move PROJ-123 "Invalid Status"
```
Output:
```
No transition found for status: Invalid Status

Available transitions:
[Table of available transitions]
```

### Transition not available

If a transition exists but isn't currently available:
```bash
scry issue move PROJ-123 "Closed"
```
Output:
```
Transition "Closed" is not available for PROJ-123
```

## API Endpoints Used

### Get Transitions
- **Endpoint**: `/rest/api/3/issue/{issueIdOrKey}/transitions`
- **Method**: GET
- **Response**: List of available transitions with target statuses

### Execute Transition
- **Endpoint**: `/rest/api/3/issue/{issueIdOrKey}/transitions`
- **Method**: POST
- **Body**:
  ```json
  {
    "transition": {
      "id": "21"
    }
  }
  ```

## Related Commands

- `scry issue view` - View issue details including current status
- `scry issue list` - List issues with status filtering
- `scry issue edit` - Edit issue fields
