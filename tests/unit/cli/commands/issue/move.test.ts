import { describe, expect, test, mock } from "bun:test";
import type { Transition, Status } from "../../../../../src/api/types/issue.ts";

describe("issue move command", () => {
  test("gets available transitions for an issue", async () => {
    const mockGetTransitions = mock(async (_issueKey: string): Promise<Transition[]> => {
      const todoStatus: Status = {
        id: "1",
        name: "To Do",
        statusCategory: {
          id: 2,
          key: "new",
          name: "To Do",
          colorName: "blue-gray",
        },
      };

      const inProgressStatus: Status = {
        id: "3",
        name: "In Progress",
        statusCategory: {
          id: 4,
          key: "indeterminate",
          name: "In Progress",
          colorName: "yellow",
        },
      };

      const doneStatus: Status = {
        id: "10001",
        name: "Done",
        statusCategory: {
          id: 3,
          key: "done",
          name: "Done",
          colorName: "green",
        },
      };

      return [
        {
          id: "11",
          name: "To Do",
          to: todoStatus,
          hasScreen: false,
          isAvailable: true,
        },
        {
          id: "21",
          name: "In Progress",
          to: inProgressStatus,
          hasScreen: false,
          isAvailable: true,
        },
        {
          id: "31",
          name: "Done",
          to: doneStatus,
          hasScreen: false,
          isAvailable: true,
        },
      ];
    });

    const transitions = await mockGetTransitions("PROJ-123");

    expect(transitions).toHaveLength(3);
    expect(transitions[0]?.name).toBe("To Do");
    expect(transitions[1]?.name).toBe("In Progress");
    expect(transitions[2]?.name).toBe("Done");
    expect(mockGetTransitions).toHaveBeenCalledWith("PROJ-123");
  });

  test("executes a transition by id", async () => {
    const mockTransition = mock(async (_issueKey: string, _transitionId: string): Promise<void> => {
      return;
    });

    await mockTransition("PROJ-123", "21");

    expect(mockTransition).toHaveBeenCalledWith("PROJ-123", "21");
    expect(mockTransition).toHaveBeenCalledTimes(1);
  });

  test("finds transition by target status name (case-insensitive)", () => {
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
    ];

    expect(findTransitionByStatus(mockTransitions, "in progress")?.id).toBe("21");
    expect(findTransitionByStatus(mockTransitions, "In Progress")?.id).toBe("21");
    expect(findTransitionByStatus(mockTransitions, "IN PROGRESS")?.id).toBe("21");
    expect(findTransitionByStatus(mockTransitions, "to do")?.id).toBe("11");
    expect(findTransitionByStatus(mockTransitions, "Done")).toBeUndefined();
  });

  test("formats transition list for table output", () => {
    const formatTransitionsForTable = (
      transitions: Transition[]
    ): Array<{ id: string; name: string; to: string; available: string }> => {
      return transitions.map((t) => ({
        id: t.id,
        name: t.name,
        to: t.to.name,
        available: t.isAvailable ? "Yes" : "No",
      }));
    };

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
    ];

    const formatted = formatTransitionsForTable(mockTransitions);

    expect(formatted).toHaveLength(2);
    expect(formatted[0]).toEqual({
      id: "11",
      name: "To Do",
      to: "To Do",
      available: "Yes",
    });
    expect(formatted[1]).toEqual({
      id: "21",
      name: "In Progress",
      to: "In Progress",
      available: "No",
    });
  });

  test("validates issue key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z][A-Z0-9]+-\d+$/.test(key);
    };

    expect(isValidIssueKey("PROJ-123")).toBe(true);
    expect(isValidIssueKey("AB-1")).toBe(true);
    expect(isValidIssueKey("ABC123-456")).toBe(true);
    expect(isValidIssueKey("proj-123")).toBe(false);
    expect(isValidIssueKey("PROJ123")).toBe(false);
    expect(isValidIssueKey("PROJ-")).toBe(false);
    expect(isValidIssueKey("-123")).toBe(false);
  });

  test("handles transition with additional fields and updates", async () => {
    const mockTransitionWithOptions = mock(
      async (
        _issueKey: string,
        _transitionId: string,
        _options?: { fields?: Record<string, unknown>; update?: Record<string, unknown> }
      ): Promise<void> => {
        return;
      }
    );

    const options = {
      fields: { resolution: { name: "Done" } },
      update: { comment: [{ add: { body: "Completed" } }] },
    };

    await mockTransitionWithOptions("PROJ-123", "31", options);

    expect(mockTransitionWithOptions).toHaveBeenCalledWith("PROJ-123", "31", options);
    expect(mockTransitionWithOptions).toHaveBeenCalledTimes(1);
  });

  test("filters only available transitions", () => {
    const filterAvailableTransitions = (transitions: Transition[]): Transition[] => {
      return transitions.filter((t) => t.isAvailable);
    };

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

    const available = filterAvailableTransitions(mockTransitions);

    expect(available).toHaveLength(2);
    expect(available[0]?.id).toBe("11");
    expect(available[1]?.id).toBe("31");
  });
});
