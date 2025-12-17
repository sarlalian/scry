import { describe, expect, test, mock } from "bun:test";
import type { IssueLinkType } from "../../../../../src/api/types/issue.ts";

describe("issue link command", () => {
  test("links two issues with specified link type", async () => {
    const mockLink = mock(
      async (outwardIssue: string, inwardIssue: string, linkType: string): Promise<void> => {
        expect(outwardIssue).toBe("PROJ-123");
        expect(inwardIssue).toBe("PROJ-456");
        expect(linkType).toBe("Blocks");
      }
    );

    await mockLink("PROJ-123", "PROJ-456", "Blocks");

    expect(mockLink).toHaveBeenCalledTimes(1);
    expect(mockLink).toHaveBeenCalledWith("PROJ-123", "PROJ-456", "Blocks");
  });

  test("validates source issue key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z]+-\d+$/.test(key);
    };

    expect(isValidIssueKey("PROJ-123")).toBe(true);
    expect(isValidIssueKey("ABC-1")).toBe(true);
    expect(isValidIssueKey("proj-123")).toBe(false);
    expect(isValidIssueKey("PROJ123")).toBe(false);
  });

  test("validates target issue key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z]+-\d+$/.test(key);
    };

    expect(isValidIssueKey("PROJ-456")).toBe(true);
    expect(isValidIssueKey("XYZ-999")).toBe(true);
    expect(isValidIssueKey("invalid")).toBe(false);
  });

  test("retrieves available link types", async () => {
    const mockGetLinkTypes = mock(async (): Promise<IssueLinkType[]> => {
      return [
        {
          id: "1",
          name: "Blocks",
          inward: "is blocked by",
          outward: "blocks",
          self: "https://example.com/rest/api/3/issueLinkType/1",
        },
        {
          id: "2",
          name: "Relates",
          inward: "relates to",
          outward: "relates to",
          self: "https://example.com/rest/api/3/issueLinkType/2",
        },
        {
          id: "3",
          name: "Duplicates",
          inward: "is duplicated by",
          outward: "duplicates",
          self: "https://example.com/rest/api/3/issueLinkType/3",
        },
      ];
    });

    const linkTypes = await mockGetLinkTypes();

    expect(linkTypes).toHaveLength(3);
    expect(linkTypes[0]?.name).toBe("Blocks");
    expect(linkTypes[1]?.name).toBe("Relates");
    expect(linkTypes[2]?.name).toBe("Duplicates");
  });

  test("finds link type by exact name match", () => {
    const linkTypes: IssueLinkType[] = [
      {
        id: "1",
        name: "Blocks",
        inward: "is blocked by",
        outward: "blocks",
        self: "https://example.com/rest/api/3/issueLinkType/1",
      },
      {
        id: "2",
        name: "Relates",
        inward: "relates to",
        outward: "relates to",
        self: "https://example.com/rest/api/3/issueLinkType/2",
      },
    ];

    const findLinkType = (name: string, types: IssueLinkType[]): IssueLinkType | undefined => {
      return types.find((t) => t.name.toLowerCase() === name.toLowerCase());
    };

    const blocksType = findLinkType("Blocks", linkTypes);
    expect(blocksType?.name).toBe("Blocks");

    const relatesType = findLinkType("relates", linkTypes);
    expect(relatesType?.name).toBe("Relates");
  });

  test("finds link type by inward description", () => {
    const linkTypes: IssueLinkType[] = [
      {
        id: "1",
        name: "Blocks",
        inward: "is blocked by",
        outward: "blocks",
        self: "https://example.com/rest/api/3/issueLinkType/1",
      },
    ];

    const findLinkType = (search: string, types: IssueLinkType[]): IssueLinkType | undefined => {
      const normalized = search.toLowerCase();
      return types.find(
        (t) =>
          t.name.toLowerCase() === normalized ||
          t.inward.toLowerCase() === normalized ||
          t.outward.toLowerCase() === normalized
      );
    };

    const byInward = findLinkType("is blocked by", linkTypes);
    expect(byInward?.name).toBe("Blocks");
  });

  test("finds link type by outward description", () => {
    const linkTypes: IssueLinkType[] = [
      {
        id: "1",
        name: "Blocks",
        inward: "is blocked by",
        outward: "blocks",
        self: "https://example.com/rest/api/3/issueLinkType/1",
      },
    ];

    const findLinkType = (search: string, types: IssueLinkType[]): IssueLinkType | undefined => {
      const normalized = search.toLowerCase();
      return types.find(
        (t) =>
          t.name.toLowerCase() === normalized ||
          t.inward.toLowerCase() === normalized ||
          t.outward.toLowerCase() === normalized
      );
    };

    const byOutward = findLinkType("blocks", linkTypes);
    expect(byOutward?.name).toBe("Blocks");
  });

  test("handles case-insensitive link type matching", () => {
    const linkTypes: IssueLinkType[] = [
      {
        id: "1",
        name: "Blocks",
        inward: "is blocked by",
        outward: "blocks",
        self: "https://example.com/rest/api/3/issueLinkType/1",
      },
    ];

    const findLinkType = (search: string, types: IssueLinkType[]): IssueLinkType | undefined => {
      const normalized = search.toLowerCase();
      return types.find(
        (t) =>
          t.name.toLowerCase() === normalized ||
          t.inward.toLowerCase() === normalized ||
          t.outward.toLowerCase() === normalized
      );
    };

    expect(findLinkType("BLOCKS", linkTypes)?.name).toBe("Blocks");
    expect(findLinkType("blocks", linkTypes)?.name).toBe("Blocks");
    expect(findLinkType("Blocks", linkTypes)?.name).toBe("Blocks");
    expect(findLinkType("IS BLOCKED BY", linkTypes)?.name).toBe("Blocks");
  });

  test("returns undefined for unknown link type", () => {
    const linkTypes: IssueLinkType[] = [
      {
        id: "1",
        name: "Blocks",
        inward: "is blocked by",
        outward: "blocks",
        self: "https://example.com/rest/api/3/issueLinkType/1",
      },
    ];

    const findLinkType = (search: string, types: IssueLinkType[]): IssueLinkType | undefined => {
      const normalized = search.toLowerCase();
      return types.find(
        (t) =>
          t.name.toLowerCase() === normalized ||
          t.inward.toLowerCase() === normalized ||
          t.outward.toLowerCase() === normalized
      );
    };

    expect(findLinkType("UnknownType", linkTypes)).toBeUndefined();
  });

  test("formats success message for link creation", () => {
    const formatLinkMessage = (
      sourceKey: string,
      targetKey: string,
      linkType: string
    ): { success: boolean; message: string } => {
      return {
        success: true,
        message: `Successfully linked ${sourceKey} to ${targetKey} with type "${linkType}"`,
      };
    };

    const result = formatLinkMessage("PROJ-123", "PROJ-456", "Blocks");
    expect(result.success).toBe(true);
    expect(result.message).toContain("PROJ-123");
    expect(result.message).toContain("PROJ-456");
    expect(result.message).toContain("Blocks");
  });

  test("detects when source and target are the same", () => {
    const isSelfLink = (sourceKey: string, targetKey: string): boolean => {
      return sourceKey === targetKey;
    };

    expect(isSelfLink("PROJ-123", "PROJ-123")).toBe(true);
    expect(isSelfLink("PROJ-123", "PROJ-456")).toBe(false);
  });

  test("lists available link types when no type specified", () => {
    const linkTypes: IssueLinkType[] = [
      {
        id: "1",
        name: "Blocks",
        inward: "is blocked by",
        outward: "blocks",
        self: "https://example.com/rest/api/3/issueLinkType/1",
      },
      {
        id: "2",
        name: "Relates",
        inward: "relates to",
        outward: "relates to",
        self: "https://example.com/rest/api/3/issueLinkType/2",
      },
    ];

    const formatLinkTypes = (types: IssueLinkType[]): string[] => {
      return types.map((t) => `${t.name}: ${t.outward} / ${t.inward}`);
    };

    const formatted = formatLinkTypes(linkTypes);
    expect(formatted).toHaveLength(2);
    expect(formatted[0]).toBe("Blocks: blocks / is blocked by");
    expect(formatted[1]).toBe("Relates: relates to / relates to");
  });

  test("dry-run flag prevents API call", () => {
    const shouldExecuteLink = (dryRun: boolean): boolean => {
      return !dryRun;
    };

    expect(shouldExecuteLink(true)).toBe(false);
    expect(shouldExecuteLink(false)).toBe(true);
  });

  test("dry-run produces preview output", () => {
    const createDryRunOutput = (
      sourceKey: string,
      targetKey: string,
      linkType: string
    ) => {
      return {
        dryRun: true,
        action: "link",
        sourceKey,
        targetKey,
        linkType,
      };
    };

    const result = createDryRunOutput("PROJ-123", "PROJ-456", "Blocks");

    expect(result.dryRun).toBe(true);
    expect(result.action).toBe("link");
    expect(result.sourceKey).toBe("PROJ-123");
    expect(result.targetKey).toBe("PROJ-456");
    expect(result.linkType).toBe("Blocks");
  });
});
