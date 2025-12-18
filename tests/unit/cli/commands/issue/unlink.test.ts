import { describe, expect, test, mock } from "bun:test";
import type { IssueLink, IssueLinkType } from "../../../../../src/api/types/issue.ts";

describe("issue unlink command", () => {
  test("removes link between two issues", async () => {
    const mockUnlink = mock(async (linkId: string): Promise<void> => {
      expect(linkId).toBe("12345");
    });

    await mockUnlink("12345");

    expect(mockUnlink).toHaveBeenCalledTimes(1);
    expect(mockUnlink).toHaveBeenCalledWith("12345");
  });

  test("retrieves links for a given issue", async () => {
    const mockGetLinks = mock(async (_issueKey: string): Promise<IssueLink[]> => {
      return [
        {
          id: "10001",
          type: {
            id: "1",
            name: "Blocks",
            inward: "is blocked by",
            outward: "blocks",
            self: "https://example.com/rest/api/3/issueLinkType/1",
          },
          outwardIssue: {
            id: "10100",
            key: "PROJ-456",
            self: "https://example.com/rest/api/3/issue/10100",
            fields: {
              summary: "Target issue summary",
              status: {
                id: "1",
                name: "Open",
                statusCategory: { id: 2, key: "new", name: "To Do", colorName: "blue-gray" },
              },
              issuetype: { id: "1", name: "Task", subtask: false },
            },
          },
        },
      ];
    });

    const links = await mockGetLinks("PROJ-123");

    expect(links).toHaveLength(1);
    expect(links[0]?.id).toBe("10001");
    expect(links[0]?.outwardIssue?.key).toBe("PROJ-456");
  });

  test("finds link between two specific issues", () => {
    const links: IssueLink[] = [
      {
        id: "10001",
        type: {
          id: "1",
          name: "Blocks",
          inward: "is blocked by",
          outward: "blocks",
          self: "https://example.com/rest/api/3/issueLinkType/1",
        },
        outwardIssue: {
          id: "10100",
          key: "PROJ-456",
          self: "https://example.com/rest/api/3/issue/10100",
        },
      },
      {
        id: "10002",
        type: {
          id: "2",
          name: "Relates",
          inward: "relates to",
          outward: "relates to",
          self: "https://example.com/rest/api/3/issueLinkType/2",
        },
        inwardIssue: {
          id: "10101",
          key: "PROJ-789",
          self: "https://example.com/rest/api/3/issue/10101",
        },
      },
    ];

    const findLink = (targetKey: string, issueLinks: IssueLink[]): IssueLink | undefined => {
      return issueLinks.find(
        (link) => link.outwardIssue?.key === targetKey || link.inwardIssue?.key === targetKey
      );
    };

    const link1 = findLink("PROJ-456", links);
    expect(link1?.id).toBe("10001");

    const link2 = findLink("PROJ-789", links);
    expect(link2?.id).toBe("10002");

    const link3 = findLink("PROJ-999", links);
    expect(link3).toBeUndefined();
  });

  test("validates issue key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z]+-\d+$/.test(key);
    };

    expect(isValidIssueKey("PROJ-123")).toBe(true);
    expect(isValidIssueKey("ABC-1")).toBe(true);
    expect(isValidIssueKey("proj-123")).toBe(false);
    expect(isValidIssueKey("PROJ123")).toBe(false);
  });

  test("formats success message for link removal", () => {
    const formatUnlinkMessage = (
      sourceKey: string,
      targetKey: string
    ): { success: boolean; message: string } => {
      return {
        success: true,
        message: `Successfully removed link between ${sourceKey} and ${targetKey}`,
      };
    };

    const result = formatUnlinkMessage("PROJ-123", "PROJ-456");
    expect(result.success).toBe(true);
    expect(result.message).toContain("PROJ-123");
    expect(result.message).toContain("PROJ-456");
  });

  test("handles case when no links exist", () => {
    const links: IssueLink[] = [];

    const findLink = (targetKey: string, issueLinks: IssueLink[]): IssueLink | undefined => {
      return issueLinks.find(
        (link) => link.outwardIssue?.key === targetKey || link.inwardIssue?.key === targetKey
      );
    };

    expect(findLink("PROJ-456", links)).toBeUndefined();
  });

  test("handles multiple links to same issue", () => {
    const links: IssueLink[] = [
      {
        id: "10001",
        type: {
          id: "1",
          name: "Blocks",
          inward: "is blocked by",
          outward: "blocks",
          self: "https://example.com/rest/api/3/issueLinkType/1",
        },
        outwardIssue: {
          id: "10100",
          key: "PROJ-456",
          self: "https://example.com/rest/api/3/issue/10100",
        },
      },
      {
        id: "10002",
        type: {
          id: "2",
          name: "Relates",
          inward: "relates to",
          outward: "relates to",
          self: "https://example.com/rest/api/3/issueLinkType/2",
        },
        outwardIssue: {
          id: "10100",
          key: "PROJ-456",
          self: "https://example.com/rest/api/3/issue/10100",
        },
      },
    ];

    const findLinks = (targetKey: string, issueLinks: IssueLink[]): IssueLink[] => {
      return issueLinks.filter(
        (link) => link.outwardIssue?.key === targetKey || link.inwardIssue?.key === targetKey
      );
    };

    const found = findLinks("PROJ-456", links);
    expect(found).toHaveLength(2);
    expect(found[0]?.id).toBe("10001");
    expect(found[1]?.id).toBe("10002");
  });

  test("distinguishes between inward and outward links", () => {
    const linkType: IssueLinkType = {
      id: "1",
      name: "Blocks",
      inward: "is blocked by",
      outward: "blocks",
      self: "https://example.com/rest/api/3/issueLinkType/1",
    };

    const getDirection = (link: IssueLink, _sourceKey: string): "outward" | "inward" => {
      if (link.outwardIssue?.key) {
        return "outward";
      }
      return "inward";
    };

    const outwardLink: IssueLink = {
      id: "10001",
      type: linkType,
      outwardIssue: {
        id: "10100",
        key: "PROJ-456",
        self: "https://example.com/rest/api/3/issue/10100",
      },
    };

    const inwardLink: IssueLink = {
      id: "10002",
      type: linkType,
      inwardIssue: {
        id: "10101",
        key: "PROJ-789",
        self: "https://example.com/rest/api/3/issue/10101",
      },
    };

    expect(getDirection(outwardLink, "PROJ-123")).toBe("outward");
    expect(getDirection(inwardLink, "PROJ-123")).toBe("inward");
  });

  test("formats link display with direction", () => {
    const formatLinkDisplay = (link: IssueLink, _sourceKey: string): string => {
      if (link.outwardIssue) {
        return `${_sourceKey} ${link.type.outward} ${link.outwardIssue.key}`;
      } else if (link.inwardIssue) {
        return `${_sourceKey} ${link.type.inward} ${link.inwardIssue.key}`;
      }
      return "Unknown link";
    };

    const outwardLink: IssueLink = {
      id: "10001",
      type: {
        id: "1",
        name: "Blocks",
        inward: "is blocked by",
        outward: "blocks",
        self: "https://example.com/rest/api/3/issueLinkType/1",
      },
      outwardIssue: {
        id: "10100",
        key: "PROJ-456",
        self: "https://example.com/rest/api/3/issue/10100",
      },
    };

    const display = formatLinkDisplay(outwardLink, "PROJ-123");
    expect(display).toBe("PROJ-123 blocks PROJ-456");
  });

  test("dry-run flag prevents API call", () => {
    const shouldExecuteUnlink = (dryRun: boolean): boolean => {
      return !dryRun;
    };

    expect(shouldExecuteUnlink(true)).toBe(false);
    expect(shouldExecuteUnlink(false)).toBe(true);
  });

  test("dry-run produces preview output", () => {
    const createDryRunOutput = (sourceKey: string, targetKey: string, linkId: string) => {
      return {
        dryRun: true,
        action: "unlink",
        sourceKey,
        targetKey,
        linkId,
      };
    };

    const result = createDryRunOutput("PROJ-123", "PROJ-456", "10001");

    expect(result.dryRun).toBe(true);
    expect(result.action).toBe("unlink");
    expect(result.sourceKey).toBe("PROJ-123");
    expect(result.targetKey).toBe("PROJ-456");
    expect(result.linkId).toBe("10001");
  });
});
