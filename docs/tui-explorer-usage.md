# Explorer TUI Component

The Explorer component provides an interactive terminal UI for browsing and selecting Jira issues.

## Features

- **Interactive issue list**: Display issues in a table format with key columns
- **Keyboard navigation**:
  - Arrow keys (↑/↓) for navigation
  - Vim-style keys (j/k) for navigation
  - Wraps around at list boundaries
- **Issue selection**: Press Enter to select an issue
- **Search/filtering**: Press `/` to filter issues by text
- **Exit handling**: Press `q` or ESC to exit

## Usage

```typescript
import React from "react";
import { render } from "ink";
import { Explorer } from "./tui/explorer.tsx";
import type { Issue } from "./api/types/issue.ts";

// Fetch or provide your issues
const issues: Issue[] = [...];

// Render the explorer
const { waitUntilExit } = render(
  <Explorer
    issues={issues}
    onSelect={(issue) => {
      console.log("Selected:", issue.key);
      // Handle issue selection (e.g., open detail view)
    }}
    onExit={() => {
      console.log("Exiting explorer");
      process.exit(0);
    }}
  />
);

await waitUntilExit();
```

## Props

### `issues: Issue[]` (required)
Array of Jira issues to display in the explorer.

### `onSelect?: (issue: Issue) => void`
Callback invoked when user selects an issue by pressing Enter.

### `onExit?: () => void`
Callback invoked when user exits the explorer by pressing 'q' or ESC.

## Keyboard Controls

| Key | Action |
|-----|--------|
| ↑ / k | Move selection up |
| ↓ / j | Move selection down |
| Enter | Select current issue |
| / | Activate search mode |
| ESC | Clear search / Exit |
| q | Exit explorer |

## Search Mode

Press `/` to enter search mode. Type to filter issues by:
- Issue key
- Summary
- Status
- Assignee name

Press ESC to exit search mode and clear the filter.

## Display Columns

The explorer displays the following columns:
- **Key**: Issue key (e.g., PROJ-123)
- **Summary**: Issue title (truncated to 48 characters)
- **Status**: Current issue status
- **Assignee**: Display name of assigned user

## Integration Example

```typescript
import { Command } from "commander";
import { render } from "ink";
import { Explorer } from "../tui/index.ts";
import { IssueEndpoint } from "../api/endpoints/issue.ts";
import { JiraClient } from "../api/client.ts";
import { getConfigManager } from "../config/index.ts";

export const exploreCommand = new Command("explore")
  .description("Browse issues interactively")
  .option("-p, --project <key>", "Project key")
  .action(async (opts) => {
    const config = getConfigManager().load();
    const client = new JiraClient(config);
    const endpoint = new IssueEndpoint(client);

    const result = await endpoint.search(
      `project = "${opts.project ?? config.project.key}"`,
      { maxResults: 100 }
    );

    const { waitUntilExit } = render(
      <Explorer
        issues={result.issues}
        onSelect={(issue) => {
          // Open issue detail view or perform action
          console.log(`\\nSelected: ${issue.key}`);
          process.exit(0);
        }}
        onExit={() => {
          process.exit(0);
        }}
      />
    );

    await waitUntilExit();
  });
```
