import type { Server } from "bun";
import {
  MOCK_USERS,
  MOCK_PROJECTS,
  MOCK_ISSUES,
  MOCK_TRANSITIONS,
  MOCK_BOARDS,
  MOCK_SPRINTS,
  createMockIssue,
  resetMockData,
} from "./data.ts";
import type { JiraErrorResponse } from "../../src/api/types/common.ts";

export class MockJiraServer {
  private server: Server<unknown> | null = null;
  private port: number;

  constructor(port: number = 3333) {
    this.port = port;
  }

  start(): void {
    if (this.server) {
      throw new Error("Server is already running");
    }

    this.server = Bun.serve({
      port: this.port,
      fetch: this.handleRequest.bind(this),
    });
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    resetMockData();
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (!this.checkAuth(request)) {
      return this.errorResponse(401, "Authentication required");
    }

    try {
      if (pathname === "/rest/api/3/myself") {
        return this.handleGetMyself(request);
      }

      if (pathname === "/rest/api/3/search/jql" && request.method === "POST") {
        return await this.handleSearchJql(request);
      }

      if (pathname === "/rest/api/3/issue" && request.method === "POST") {
        return await this.handleCreateIssue(request);
      }

      const issueMatch = pathname.match(/^\/rest\/api\/3\/issue\/([A-Z]+-\d+)$/);
      if (issueMatch && issueMatch[1]) {
        const issueKey = issueMatch[1];
        if (request.method === "GET") {
          return this.handleGetIssue(issueKey);
        }
        if (request.method === "PUT") {
          return await this.handleUpdateIssue(issueKey, request);
        }
        if (request.method === "DELETE") {
          return this.handleDeleteIssue(issueKey);
        }
      }

      const transitionsMatch = pathname.match(/^\/rest\/api\/3\/issue\/([A-Z]+-\d+)\/transitions$/);
      if (transitionsMatch && transitionsMatch[1]) {
        const issueKey = transitionsMatch[1];
        if (request.method === "GET") {
          return this.handleGetTransitions(issueKey);
        }
        if (request.method === "POST") {
          return await this.handleExecuteTransition(issueKey, request);
        }
      }

      if (pathname === "/rest/api/3/project/search") {
        return this.handleSearchProjects(url);
      }

      const projectMatch = pathname.match(/^\/rest\/api\/3\/project\/([A-Z]+)$/);
      if (projectMatch && projectMatch[1]) {
        const projectKey = projectMatch[1];
        return this.handleGetProject(projectKey);
      }

      if (pathname === "/rest/agile/1.0/board") {
        return this.handleListBoards(url);
      }

      const boardMatch = pathname.match(/^\/rest\/agile\/1\.0\/board\/(\d+)$/);
      if (boardMatch && boardMatch[1]) {
        const boardId = parseInt(boardMatch[1], 10);
        return this.handleGetBoard(boardId);
      }

      const sprintMatch = pathname.match(/^\/rest\/agile\/1\.0\/board\/(\d+)\/sprint$/);
      if (sprintMatch && sprintMatch[1]) {
        const boardId = parseInt(sprintMatch[1], 10);
        return this.handleListSprints(boardId, url);
      }

      const sprintIdMatch = pathname.match(/^\/rest\/agile\/1\.0\/sprint\/(\d+)$/);
      if (sprintIdMatch && sprintIdMatch[1]) {
        const sprintId = parseInt(sprintIdMatch[1], 10);
        return this.handleGetSprint(sprintId);
      }

      return this.errorResponse(404, "Endpoint not found");
    } catch (error) {
      console.error("Error handling request:", error);
      return this.errorResponse(500, "Internal server error");
    }
  }

  private checkAuth(request: Request): boolean {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return false;
    }

    if (authHeader.startsWith("Basic ")) {
      const credentials = authHeader.substring(6);
      try {
        const decoded = atob(credentials);
        const [, token] = decoded.split(":");
        if (!token || token.trim() === "") {
          return false;
        }
      } catch {
        return false;
      }
      return true;
    }

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (!token || token.trim() === "") {
        return false;
      }
      return true;
    }

    return false;
  }

  private handleGetMyself(request: Request): Response {
    const authHeader = request.headers.get("Authorization");
    let email = "test@example.com";

    if (authHeader?.startsWith("Basic ")) {
      const credentials = atob(authHeader.substring(6));
      const [username] = credentials.split(":");
      if (username) {
        email = username;
      }
    }

    const user = MOCK_USERS["test-user"];
    return Response.json({
      ...user,
      emailAddress: email,
    });
  }

  private async handleSearchJql(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      jql: string;
      maxResults?: number;
      startAt?: number;
    };
    const jql = body.jql;
    const maxResults = body.maxResults ?? 50;
    const startAt = body.startAt ?? 0;

    let filteredIssues = Object.values(MOCK_ISSUES);

    const projectMatch = jql.match(/project\s*=\s*([A-Z]+)/i);
    if (projectMatch) {
      const projectKey = projectMatch[1];
      filteredIssues = filteredIssues.filter(
        (issue) => issue.fields.project.key === projectKey
      );
    }

    const statusMatch = jql.match(/status\s*=\s*"([^"]+)"/i);
    if (statusMatch) {
      const statusName = statusMatch[1];
      filteredIssues = filteredIssues.filter(
        (issue) => issue.fields.status.name === statusName
      );
    }

    const keyMatch = jql.match(/key\s*=\s*([A-Z]+-\d+)/i);
    if (keyMatch) {
      const issueKey = keyMatch[1];
      filteredIssues = filteredIssues.filter((issue) => issue.key === issueKey);
    }

    const paginatedIssues = filteredIssues.slice(startAt, startAt + maxResults);

    return Response.json({
      issues: paginatedIssues,
      maxResults,
      startAt,
      total: filteredIssues.length,
      isLast: startAt + maxResults >= filteredIssues.length,
    });
  }

  private handleGetIssue(issueKey: string): Response {
    const issue = MOCK_ISSUES[issueKey];
    if (!issue) {
      return this.errorResponse(404, `Issue ${issueKey} not found`);
    }
    return Response.json(issue);
  }

  private async handleCreateIssue(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      fields: {
        project?: { key?: string };
        issuetype?: { name?: string };
        summary?: string;
        [key: string]: unknown;
      };
    };
    const fields = body.fields;

    if (!fields.project?.key || !fields.issuetype?.name || !fields.summary) {
      return this.errorResponse(400, "Missing required fields");
    }

    const result = createMockIssue(fields, this.getUrl());
    return Response.json(result, { status: 201 });
  }

  private async handleUpdateIssue(issueKey: string, request: Request): Promise<Response> {
    const issue = MOCK_ISSUES[issueKey];
    if (!issue) {
      return this.errorResponse(404, `Issue ${issueKey} not found`);
    }

    const body = (await request.json()) as { fields?: Record<string, unknown> };
    const fields = body.fields;

    if (fields) {
      Object.assign(issue.fields, fields);
      issue.fields.updated = new Date().toISOString();
    }

    return new Response(null, { status: 204 });
  }

  private handleDeleteIssue(issueKey: string): Response {
    const issue = MOCK_ISSUES[issueKey];
    if (!issue) {
      return this.errorResponse(404, `Issue ${issueKey} not found`);
    }

    delete MOCK_ISSUES[issueKey];
    return new Response(null, { status: 204 });
  }

  private handleGetTransitions(issueKey: string): Response {
    const issue = MOCK_ISSUES[issueKey];
    if (!issue) {
      return this.errorResponse(404, `Issue ${issueKey} not found`);
    }

    const transitions = MOCK_TRANSITIONS[issueKey] || [];
    return Response.json({ transitions });
  }

  private async handleExecuteTransition(issueKey: string, request: Request): Promise<Response> {
    const issue = MOCK_ISSUES[issueKey];
    if (!issue) {
      return this.errorResponse(404, `Issue ${issueKey} not found`);
    }

    const body = (await request.json()) as { transition?: { id?: string } };
    const transitionId = body.transition?.id;

    if (!transitionId) {
      return this.errorResponse(400, "Missing transition id");
    }

    const transitions = MOCK_TRANSITIONS[issueKey] || [];
    const transition = transitions.find((t) => t.id === transitionId);

    if (transition) {
      issue.fields.status = transition.to;
      issue.fields.updated = new Date().toISOString();
    }

    return new Response(null, { status: 204 });
  }

  private handleSearchProjects(url: URL): Response {
    const maxResults = parseInt(url.searchParams.get("maxResults") || "50", 10);
    const startAt = parseInt(url.searchParams.get("startAt") || "0", 10);
    const query = url.searchParams.get("query");

    let projects = Object.values(MOCK_PROJECTS);

    if (query) {
      projects = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.key.toLowerCase().includes(query.toLowerCase())
      );
    }

    const paginatedProjects = projects.slice(startAt, startAt + maxResults);

    return Response.json({
      self: `${this.getUrl()}/rest/api/3/project/search`,
      maxResults,
      startAt,
      total: projects.length,
      isLast: startAt + maxResults >= projects.length,
      values: paginatedProjects,
    });
  }

  private handleGetProject(projectKey: string): Response {
    const project = MOCK_PROJECTS[projectKey];
    if (!project) {
      return this.errorResponse(404, `Project ${projectKey} not found`);
    }
    return Response.json(project);
  }

  private handleListBoards(url: URL): Response {
    const maxResults = parseInt(url.searchParams.get("maxResults") || "50", 10);
    const startAt = parseInt(url.searchParams.get("startAt") || "0", 10);
    const boardType = url.searchParams.get("type");
    const projectKeyOrId = url.searchParams.get("projectKeyOrId");

    let boards = Object.values(MOCK_BOARDS);

    if (boardType) {
      boards = boards.filter((board) => board.type === boardType);
    }

    if (projectKeyOrId) {
      boards = boards.filter(
        (board) =>
          board.location?.projectKey === projectKeyOrId ||
          board.location?.projectId?.toString() === projectKeyOrId
      );
    }

    const paginatedBoards = boards.slice(startAt, startAt + maxResults);

    return Response.json({
      maxResults,
      startAt,
      total: boards.length,
      isLast: startAt + maxResults >= boards.length,
      values: paginatedBoards,
    });
  }

  private handleGetBoard(boardId: number): Response {
    const board = MOCK_BOARDS[boardId];
    if (!board) {
      return this.errorResponse(404, `Board ${boardId} not found`);
    }
    return Response.json(board);
  }

  private handleListSprints(boardId: number, url: URL): Response {
    const board = MOCK_BOARDS[boardId];
    if (!board) {
      return this.errorResponse(404, `Board ${boardId} not found`);
    }

    const maxResults = parseInt(url.searchParams.get("maxResults") || "50", 10);
    const startAt = parseInt(url.searchParams.get("startAt") || "0", 10);
    const state = url.searchParams.get("state");

    let sprints = MOCK_SPRINTS[boardId] || [];

    if (state) {
      sprints = sprints.filter((sprint) => sprint.state === state);
    }

    const paginatedSprints = sprints.slice(startAt, startAt + maxResults);

    return Response.json({
      maxResults,
      startAt,
      isLast: startAt + maxResults >= sprints.length,
      values: paginatedSprints,
    });
  }

  private handleGetSprint(sprintId: number): Response {
    for (const sprints of Object.values(MOCK_SPRINTS)) {
      const sprint = sprints.find((s) => s.id === sprintId);
      if (sprint) {
        return Response.json(sprint);
      }
    }
    return this.errorResponse(404, `Sprint ${sprintId} not found`);
  }

  private errorResponse(status: number, message: string): Response {
    const errorResponse: JiraErrorResponse = {
      errorMessages: [message],
    };
    return Response.json(errorResponse, { status });
  }
}
