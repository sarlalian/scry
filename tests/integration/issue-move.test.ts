import { describe, expect, test, mock, beforeEach } from "bun:test";
import type { Transition } from "../../src/api/types/issue.ts";
import { IssueEndpoint } from "../../src/api/endpoints/issue.ts";
import type { JiraClient } from "../../src/api/client.ts";

describe("issue move integration", () => {
  let mockClient: {
    get: ReturnType<typeof mock>;
    post: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    mockClient = {
      get: mock(),
      post: mock(),
    };
  });

  test("lists available transitions when no target status provided", async () => {
    const issueEndpoint = new IssueEndpoint(mockClient as unknown as JiraClient);

    const mockTransitions: Transition[] = [
      {
        id: "11",
        name: "To Do",
        to: {
          id: "1",
          name: "To Do",
          statusCategory: {
            id: 2,
            key: "new",
            name: "To Do",
            colorName: "blue-gray",
          },
        },
        hasScreen: false,
        isAvailable: true,
      },
      {
        id: "21",
        name: "In Progress",
        to: {
          id: "3",
          name: "In Progress",
          statusCategory: {
            id: 4,
            key: "indeterminate",
            name: "In Progress",
            colorName: "yellow",
          },
        },
        hasScreen: false,
        isAvailable: true,
      },
      {
        id: "31",
        name: "Done",
        to: {
          id: "10001",
          name: "Done",
          statusCategory: {
            id: 3,
            key: "done",
            name: "Done",
            colorName: "green",
          },
        },
        hasScreen: false,
        isAvailable: true,
      },
    ];

    mockClient.get.mockResolvedValue({ transitions: mockTransitions });

    const transitions = await issueEndpoint.getTransitions("PROJ-123");

    expect(transitions).toHaveLength(3);
    expect(transitions[0]?.name).toBe("To Do");
    expect(transitions[1]?.name).toBe("In Progress");
    expect(transitions[2]?.name).toBe("Done");
    expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/issue/PROJ-123/transitions");
  });

  test("executes transition to move issue to new status", async () => {
    const issueEndpoint = new IssueEndpoint(mockClient as unknown as JiraClient);

    mockClient.post.mockResolvedValue(undefined);

    await issueEndpoint.transition("PROJ-123", "21");

    expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/issue/PROJ-123/transitions", {
      transition: { id: "21" },
      fields: undefined,
      update: undefined,
    });
  });

  test("executes transition with additional fields", async () => {
    const issueEndpoint = new IssueEndpoint(mockClient as unknown as JiraClient);

    mockClient.post.mockResolvedValue(undefined);

    await issueEndpoint.transition("PROJ-123", "31", {
      fields: { resolution: { name: "Done" } },
    });

    expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/issue/PROJ-123/transitions", {
      transition: { id: "31" },
      fields: { resolution: { name: "Done" } },
      update: undefined,
    });
  });

  test("handles case-insensitive status name matching", async () => {
    const issueEndpoint = new IssueEndpoint(mockClient as unknown as JiraClient);

    const mockTransitions: Transition[] = [
      {
        id: "21",
        name: "In Progress",
        to: {
          id: "3",
          name: "In Progress",
          statusCategory: {
            id: 4,
            key: "indeterminate",
            name: "In Progress",
            colorName: "yellow",
          },
        },
        hasScreen: false,
        isAvailable: true,
      },
    ];

    mockClient.get.mockResolvedValue({ transitions: mockTransitions });

    const transitions = await issueEndpoint.getTransitions("PROJ-123");

    const findTransitionByStatus = (
      transitions: Transition[],
      targetStatus: string
    ): Transition | undefined => {
      const normalizedTarget = targetStatus.toLowerCase().trim();
      return transitions.find(
        (t) =>
          t.name.toLowerCase() === normalizedTarget || t.to.name.toLowerCase() === normalizedTarget
      );
    };

    expect(findTransitionByStatus(transitions, "in progress")?.id).toBe("21");
    expect(findTransitionByStatus(transitions, "IN PROGRESS")?.id).toBe("21");
    expect(findTransitionByStatus(transitions, "In Progress")?.id).toBe("21");
  });

  test("filters only available transitions for interactive selection", async () => {
    const issueEndpoint = new IssueEndpoint(mockClient as unknown as JiraClient);

    const mockTransitions: Transition[] = [
      {
        id: "11",
        name: "To Do",
        to: {
          id: "1",
          name: "To Do",
          statusCategory: {
            id: 2,
            key: "new",
            name: "To Do",
            colorName: "blue-gray",
          },
        },
        hasScreen: false,
        isAvailable: true,
      },
      {
        id: "21",
        name: "In Progress",
        to: {
          id: "3",
          name: "In Progress",
          statusCategory: {
            id: 4,
            key: "indeterminate",
            name: "In Progress",
            colorName: "yellow",
          },
        },
        hasScreen: false,
        isAvailable: false,
      },
      {
        id: "31",
        name: "Done",
        to: {
          id: "10001",
          name: "Done",
          statusCategory: {
            id: 3,
            key: "done",
            name: "Done",
            colorName: "green",
          },
        },
        hasScreen: false,
        isAvailable: true,
      },
    ];

    mockClient.get.mockResolvedValue({ transitions: mockTransitions });

    const transitions = await issueEndpoint.getTransitions("PROJ-123");
    const availableTransitions = transitions.filter((t) => t.isAvailable);

    expect(availableTransitions).toHaveLength(2);
    expect(availableTransitions[0]?.name).toBe("To Do");
    expect(availableTransitions[1]?.name).toBe("Done");
  });

  test("validates workflow transitions are returned from API correctly", async () => {
    const issueEndpoint = new IssueEndpoint(mockClient as unknown as JiraClient);

    const mockApiResponse = {
      transitions: [
        {
          id: "21",
          name: "Start Progress",
          to: {
            id: "3",
            name: "In Progress",
            statusCategory: {
              id: 4,
              key: "indeterminate",
              name: "In Progress",
              colorName: "yellow",
            },
          },
          hasScreen: false,
          isAvailable: true,
        },
      ],
    };

    mockClient.get.mockResolvedValue(mockApiResponse);

    const transitions = await issueEndpoint.getTransitions("PROJ-123");

    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({
      id: "21",
      name: "Start Progress",
      hasScreen: false,
      isAvailable: true,
    });
    expect(transitions[0]?.to.name).toBe("In Progress");
  });
});
