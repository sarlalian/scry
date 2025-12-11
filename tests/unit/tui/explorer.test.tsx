import { describe, expect, test } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { Explorer } from "../../../src/tui/explorer.tsx";
import type { Issue } from "../../../src/api/types/issue.ts";

// Helper to wait for state updates
const wait = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

const mockIssues: Issue[] = [
  {
    id: "1",
    key: "PROJ-1",
    self: "https://jira.example.com/rest/api/3/issue/1",
    fields: {
      summary: "First issue",
      status: {
        id: "1",
        name: "To Do",
        statusCategory: {
          id: 1,
          key: "new",
          name: "To Do",
          colorName: "blue-gray",
        },
      },
      assignee: {
        accountId: "user1",
        displayName: "John Doe",
        emailAddress: "john@example.com",
        avatarUrls: {},
        active: true,
        timeZone: "UTC",
        accountType: "atlassian",
      },
      issuetype: {
        id: "1",
        name: "Task",
        subtask: false,
      },
      project: {
        id: "1",
        key: "PROJ",
        name: "Project",
      },
      priority: {
        id: "3",
        name: "Medium",
      },
      created: "2023-01-01T00:00:00.000Z",
      updated: "2023-01-02T00:00:00.000Z",
    },
  },
  {
    id: "2",
    key: "PROJ-2",
    self: "https://jira.example.com/rest/api/3/issue/2",
    fields: {
      summary: "Second issue",
      status: {
        id: "2",
        name: "In Progress",
        statusCategory: {
          id: 2,
          key: "indeterminate",
          name: "In Progress",
          colorName: "yellow",
        },
      },
      assignee: {
        accountId: "user2",
        displayName: "Jane Smith",
        emailAddress: "jane@example.com",
        avatarUrls: {},
        active: true,
        timeZone: "UTC",
        accountType: "atlassian",
      },
      issuetype: {
        id: "2",
        name: "Bug",
        subtask: false,
      },
      project: {
        id: "1",
        key: "PROJ",
        name: "Project",
      },
      priority: {
        id: "2",
        name: "High",
      },
      created: "2023-01-03T00:00:00.000Z",
      updated: "2023-01-04T00:00:00.000Z",
    },
  },
];

describe("Explorer", () => {
  test("renders issue list with key columns", () => {
    const { lastFrame } = render(<Explorer issues={mockIssues} />);
    const output = lastFrame();

    expect(output).toContain("PROJ-1");
    expect(output).toContain("First issue");
    expect(output).toContain("To Do");
    expect(output).toContain("John Doe");
  });

  test("displays multiple issues", () => {
    const { lastFrame } = render(<Explorer issues={mockIssues} />);
    const output = lastFrame();

    expect(output).toContain("PROJ-1");
    expect(output).toContain("PROJ-2");
    expect(output).toContain("First issue");
    expect(output).toContain("Second issue");
  });

  test("highlights selected issue", () => {
    const { lastFrame } = render(<Explorer issues={mockIssues} />);
    const output = lastFrame();

    // First issue should be selected by default
    expect(output).toContain("PROJ-1");
  });

  test("renders empty state when no issues", () => {
    const { lastFrame } = render(<Explorer issues={[]} />);
    const output = lastFrame();

    expect(output).toContain("No issues found");
  });

  test("supports onSelect callback when issue is selected", async () => {
    let selectedIssue: Issue | undefined;
    const onSelect = (issue: Issue) => {
      selectedIssue = issue;
    };

    const { stdin } = render(<Explorer issues={mockIssues} onSelect={onSelect} />);

    // Simulate Enter key press
    stdin.write("\r");
    await wait();

    expect(selectedIssue).toBeDefined();
    expect(selectedIssue!.key).toBe("PROJ-1");
  });

  test("supports onExit callback", async () => {
    let exitCalled = false;
    const onExit = () => {
      exitCalled = true;
    };

    const { stdin } = render(<Explorer issues={mockIssues} onExit={onExit} />);

    // Simulate Escape or q key press
    stdin.write("q");
    await wait();

    expect(exitCalled).toBe(true);
  });

  test("navigates down with j key (vim-style)", async () => {
    let selectedIssue: Issue | undefined;
    const onSelect = (issue: Issue) => {
      selectedIssue = issue;
    };

    const { stdin } = render(<Explorer issues={mockIssues} onSelect={onSelect} />);

    // Navigate down with j
    stdin.write("j");
    await wait();
    stdin.write("\r"); // Enter
    await wait();

    expect(selectedIssue).toBeDefined();
    expect(selectedIssue!.key).toBe("PROJ-2");
  });

  test("navigates up with k key (vim-style)", async () => {
    let selectedIssue: Issue | undefined;
    const onSelect = (issue: Issue) => {
      selectedIssue = issue;
    };

    const { stdin } = render(<Explorer issues={mockIssues} onSelect={onSelect} />);

    // Navigate down then up
    stdin.write("j"); // Down to second issue
    await wait();
    stdin.write("k"); // Up to first issue
    await wait();
    stdin.write("\r"); // Enter
    await wait();

    expect(selectedIssue).toBeDefined();
    expect(selectedIssue!.key).toBe("PROJ-1");
  });

  test("wraps to first issue when navigating down from last", async () => {
    let selectedIssue: Issue | undefined;
    const onSelect = (issue: Issue) => {
      selectedIssue = issue;
    };

    const { stdin } = render(<Explorer issues={mockIssues} onSelect={onSelect} />);

    // Navigate to last issue and then down again
    stdin.write("j"); // Move to second issue
    await wait(100);
    stdin.write("j"); // Should wrap to first issue
    await wait(100);
    stdin.write("\r"); // Enter
    await wait(100);

    expect(selectedIssue).toBeDefined();
    expect(selectedIssue!.key).toBe("PROJ-1");
  });

  test("wraps to last issue when navigating up from first", async () => {
    let selectedIssue: Issue | undefined;
    const onSelect = (issue: Issue) => {
      selectedIssue = issue;
    };

    const { stdin } = render(<Explorer issues={mockIssues} onSelect={onSelect} />);

    // Navigate up from first issue
    stdin.write("k"); // Should wrap to last issue
    await wait();
    stdin.write("\r"); // Enter
    await wait();

    expect(selectedIssue).toBeDefined();
    expect(selectedIssue!.key).toBe("PROJ-2");
  });

  test("filters issues by search text", async () => {
    const { lastFrame, stdin } = render(<Explorer issues={mockIssues} />);

    // Activate search mode
    stdin.write("/");
    await wait();
    stdin.write("Second");
    await wait();

    const output = lastFrame();

    // Should only show the second issue
    expect(output).toContain("PROJ-2");
    expect(output).toContain("Second issue");
    expect(output).not.toContain("PROJ-1");
  });

  test("clears search filter with ESC", async () => {
    const { lastFrame, stdin } = render(<Explorer issues={mockIssues} />);

    // Activate search and then clear
    stdin.write("/");
    await wait();
    stdin.write("Second");
    await wait();
    stdin.write("\x1B"); // ESC
    await wait();

    const output = lastFrame();

    // Should show all issues again
    expect(output).toContain("PROJ-1");
    expect(output).toContain("PROJ-2");
  });

  test("displays issue count in header", () => {
    const { lastFrame } = render(<Explorer issues={mockIssues} />);
    const output = lastFrame();

    expect(output).toMatch(/2.*issues?/i);
  });
});
