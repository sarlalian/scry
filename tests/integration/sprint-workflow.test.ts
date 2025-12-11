import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "../fixtures/mock-server.ts";
import { JiraClient } from "../../src/api/client.ts";
import { SprintEndpoint } from "../../src/api/endpoints/sprint.ts";
import { BoardEndpoint } from "../../src/api/endpoints/board.ts";
import type { Config } from "../../src/config/index.ts";

describe("Sprint Workflow Integration Tests", () => {
  let server: MockJiraServer;
  let client: JiraClient;
  let sprintEndpoint: SprintEndpoint;
  let boardEndpoint: BoardEndpoint;

  beforeAll(() => {
    server = new MockJiraServer(3342);
    server.start();

    const config: Config = {
      server: server.getUrl(),
      login: "test@example.com",
      auth: {
        type: "basic",
        token: "test-token",
      },
      project: { key: "TEST" },
      board: {},
      epic: {},
      issue: {},
      output: {},
    };

    client = new JiraClient(config);
    sprintEndpoint = new SprintEndpoint(client);
    boardEndpoint = new BoardEndpoint(client);
  });

  afterAll(() => {
    server.stop();
  });

  test("list sprints for a board", async () => {
    const boards = await boardEndpoint.list();
    expect(boards.values.length).toBeGreaterThan(0);

    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    const sprints = await sprintEndpoint.list(testBoard!.id);
    expect(sprints.values).toBeDefined();
    expect(Array.isArray(sprints.values)).toBe(true);
  });

  test("list sprints with pagination", async () => {
    const boards = await boardEndpoint.list();
    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    const firstPage = await sprintEndpoint.list(testBoard!.id, {
      startAt: 0,
      maxResults: 1,
    });

    expect(firstPage.maxResults).toBe(1);
    expect(firstPage.startAt).toBe(0);

    if (firstPage.values.length > 0) {
      expect(firstPage.values.length).toBeLessThanOrEqual(1);
    }
  });

  test("filter sprints by state", async () => {
    const boards = await boardEndpoint.list();
    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    const activeSprints = await sprintEndpoint.list(testBoard!.id, {
      state: "active",
    });

    if (activeSprints.values.length > 0) {
      activeSprints.values.forEach((sprint) => {
        expect(sprint.state).toBe("active");
      });
    }

    const futureSprints = await sprintEndpoint.list(testBoard!.id, {
      state: "future",
    });

    if (futureSprints.values.length > 0) {
      futureSprints.values.forEach((sprint) => {
        expect(sprint.state).toBe("future");
      });
    }

    const closedSprints = await sprintEndpoint.list(testBoard!.id, {
      state: "closed",
    });

    if (closedSprints.values.length > 0) {
      closedSprints.values.forEach((sprint) => {
        expect(sprint.state).toBe("closed");
      });
    }
  });

  test("get specific sprint details", async () => {
    const boards = await boardEndpoint.list();
    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    const sprints = await sprintEndpoint.list(testBoard!.id);

    if (sprints.values.length > 0) {
      const sprintId = sprints.values[0]!.id;
      const sprint = await sprintEndpoint.get(sprintId);

      expect(sprint.id).toBe(sprintId);
      expect(sprint.name).toBeDefined();
      expect(sprint.state).toBeDefined();
      expect(["active", "future", "closed"]).toContain(sprint.state);
    }
  });

  test("verify sprint has required fields", async () => {
    const boards = await boardEndpoint.list();
    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    const sprints = await sprintEndpoint.list(testBoard!.id);

    if (sprints.values.length > 0) {
      const sprint = sprints.values[0]!;

      expect(sprint.id).toBeDefined();
      expect(sprint.self).toBeDefined();
      expect(sprint.state).toBeDefined();
      expect(sprint.name).toBeDefined();
      expect(sprint.originBoardId).toBe(testBoard!.id);
    }
  });

  test("verify active sprint has start and end dates", async () => {
    const boards = await boardEndpoint.list();
    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    const activeSprints = await sprintEndpoint.list(testBoard!.id, {
      state: "active",
    });

    if (activeSprints.values.length > 0) {
      const activeSprint = activeSprints.values[0]!;

      expect(activeSprint.startDate).toBeDefined();
      expect(activeSprint.endDate).toBeDefined();
      expect(new Date(activeSprint.startDate!).getTime()).toBeLessThan(
        new Date(activeSprint.endDate!).getTime()
      );
    }
  });

  test("verify closed sprint has complete date", async () => {
    const boards = await boardEndpoint.list();
    const demoBoard = boards.values.find((b) => b.name === "DEMO Board");
    expect(demoBoard).toBeDefined();

    const closedSprints = await sprintEndpoint.list(demoBoard!.id, {
      state: "closed",
    });

    if (closedSprints.values.length > 0) {
      const closedSprint = closedSprints.values[0]!;

      expect(closedSprint.state).toBe("closed");
      expect(closedSprint.completeDate).toBeDefined();
    }
  });

  test("list sprints for multiple boards", async () => {
    const boards = await boardEndpoint.list();
    expect(boards.values.length).toBeGreaterThanOrEqual(2);

    for (const board of boards.values) {
      const sprints = await sprintEndpoint.list(board.id);
      expect(sprints).toBeDefined();
      expect(Array.isArray(sprints.values)).toBe(true);

      if (sprints.values.length > 0) {
        sprints.values.forEach((sprint) => {
          expect(sprint.originBoardId).toBe(board.id);
        });
      }
    }
  });

  test("handle non-existent board when listing sprints", async () => {
    try {
      await sprintEndpoint.list(99999);
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(404);
    }
  });

  test("handle non-existent sprint when getting details", async () => {
    try {
      await sprintEndpoint.get(99999);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("verify sprint list pagination metadata", async () => {
    const boards = await boardEndpoint.list();
    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    const sprints = await sprintEndpoint.list(testBoard!.id, {
      startAt: 0,
      maxResults: 50,
    });

    expect(sprints.maxResults).toBeDefined();
    expect(sprints.startAt).toBeDefined();
    expect(sprints.isLast).toBeDefined();
    expect(typeof sprints.isLast).toBe("boolean");
  });

  test("verify boards can be filtered by project", async () => {
    const testBoards = await boardEndpoint.list({
      projectKeyOrId: "TEST",
    });

    expect(testBoards.values.length).toBeGreaterThan(0);

    testBoards.values.forEach((board) => {
      expect(board.location?.projectKey).toBe("TEST");
    });
  });

  test("verify boards can be filtered by type", async () => {
    const scrumBoards = await boardEndpoint.list({
      type: "scrum",
    });

    if (scrumBoards.values.length > 0) {
      scrumBoards.values.forEach((board) => {
        expect(board.type).toBe("scrum");
      });
    }

    const kanbanBoards = await boardEndpoint.list({
      type: "kanban",
    });

    if (kanbanBoards.values.length > 0) {
      kanbanBoards.values.forEach((board) => {
        expect(board.type).toBe("kanban");
      });
    }
  });

  test("get board details", async () => {
    const boards = await boardEndpoint.list();
    expect(boards.values.length).toBeGreaterThan(0);

    const boardId = boards.values[0]!.id;
    const board = await boardEndpoint.get(boardId);

    expect(board.id).toBe(boardId);
    expect(board.name).toBeDefined();
    expect(board.type).toBeDefined();
    expect(board.location).toBeDefined();
  });

  test("verify board has location information", async () => {
    const boards = await boardEndpoint.list();
    expect(boards.values.length).toBeGreaterThan(0);

    const testBoard = boards.values.find((b) => b.name === "TEST Board");
    expect(testBoard).toBeDefined();

    expect(testBoard!.location).toBeDefined();
    expect(testBoard!.location?.projectKey).toBe("TEST");
    expect(testBoard!.location?.projectName).toBe("Test Project");
  });

  test("handle authentication failure when accessing sprints", async () => {
    const badConfig: Config = {
      server: server.getUrl(),
      login: "test@example.com",
      auth: {
        type: "basic",
        token: "",
      },
      project: { key: "TEST" },
      board: {},
      epic: {},
      issue: {},
      output: {},
    };

    const badClient = new JiraClient(badConfig);
    const badSprintEndpoint = new SprintEndpoint(badClient);

    try {
      await badSprintEndpoint.list(1);
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(401);
    }
  });
});
