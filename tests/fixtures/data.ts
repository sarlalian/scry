import type { User } from "../../src/api/types/user.ts";
import type { Issue, Transition } from "../../src/api/types/issue.ts";
import type { Project } from "../../src/api/types/project.ts";
import type { Board } from "../../src/api/types/board.ts";
import type { Sprint } from "../../src/api/types/sprint.ts";

export const MOCK_USERS: Record<string, User> = {
  "test-user": {
    accountId: "123456:abcdef-1234-5678-9abc-def123456789",
    displayName: "Test User",
    emailAddress: "test@example.com",
    active: true,
    accountType: "atlassian",
    timeZone: "America/New_York",
    locale: "en_US",
    self: "http://localhost:3333/rest/api/3/user?accountId=123456:abcdef-1234-5678-9abc-def123456789",
    avatarUrls: {
      "48x48": "http://localhost:3333/avatar/test-user-48.png",
      "24x24": "http://localhost:3333/avatar/test-user-24.png",
      "16x16": "http://localhost:3333/avatar/test-user-16.png",
      "32x32": "http://localhost:3333/avatar/test-user-32.png",
    },
  },
  "john-doe": {
    accountId: "234567:bcdef-2345-6789-abcd-ef1234567890",
    displayName: "John Doe",
    emailAddress: "john.doe@example.com",
    active: true,
    accountType: "atlassian",
    self: "http://localhost:3333/rest/api/3/user?accountId=234567:bcdef-2345-6789-abcd-ef1234567890",
  },
  "jane-smith": {
    accountId: "345678:cdef-3456-789a-bcde-f12345678901",
    displayName: "Jane Smith",
    emailAddress: "jane.smith@example.com",
    active: true,
    accountType: "atlassian",
    self: "http://localhost:3333/rest/api/3/user?accountId=345678:cdef-3456-789a-bcde-f12345678901",
  },
};

export const MOCK_PROJECTS: Record<string, Project> = {
  TEST: {
    id: "10000",
    key: "TEST",
    name: "Test Project",
    projectTypeKey: "software",
    self: "http://localhost:3333/rest/api/3/project/10000",
    description: "A test project for development",
    lead: MOCK_USERS["john-doe"],
    style: "classic",
    isPrivate: false,
    archived: false,
    deleted: false,
    avatarUrls: {
      "48x48": "http://localhost:3333/avatar/test-48.png",
      "24x24": "http://localhost:3333/avatar/test-24.png",
      "16x16": "http://localhost:3333/avatar/test-16.png",
      "32x32": "http://localhost:3333/avatar/test-32.png",
    },
  },
  DEMO: {
    id: "10001",
    key: "DEMO",
    name: "Demo Project",
    projectTypeKey: "business",
    self: "http://localhost:3333/rest/api/3/project/10001",
    description: "Demo project for testing",
    lead: MOCK_USERS["jane-smith"],
    style: "next-gen",
    isPrivate: false,
    archived: false,
    deleted: false,
  },
};

export const MOCK_ISSUES: Record<string, Issue> = {
  "TEST-1": {
    id: "10100",
    key: "TEST-1",
    self: "http://localhost:3333/rest/api/3/issue/10100",
    fields: {
      summary: "First test issue",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is the first test issue description." }],
          },
        ],
      },
      status: {
        id: "10000",
        name: "To Do",
        statusCategory: {
          id: 2,
          key: "new",
          name: "To Do",
          colorName: "blue-gray",
        },
      },
      assignee: MOCK_USERS["john-doe"],
      reporter: MOCK_USERS["test-user"],
      priority: {
        id: "3",
        name: "Medium",
        iconUrl: "http://localhost:3333/icons/priority-medium.png",
      },
      issuetype: {
        id: "10001",
        name: "Task",
        description: "A task that needs to be done",
        iconUrl: "http://localhost:3333/icons/task.png",
        subtask: false,
      },
      project: {
        id: MOCK_PROJECTS.TEST!.id,
        key: MOCK_PROJECTS.TEST!.key,
        name: MOCK_PROJECTS.TEST!.name,
        projectTypeKey: MOCK_PROJECTS.TEST!.projectTypeKey,
      },
      labels: ["backend", "api"],
      components: [
        { id: "10000", name: "API" },
        { id: "10001", name: "Backend" },
      ],
      fixVersions: [],
      created: "2024-01-15T10:30:00.000+0000",
      updated: "2024-01-15T14:20:00.000+0000",
      resolution: null,
      resolutiondate: null,
    },
  },
  "TEST-2": {
    id: "10101",
    key: "TEST-2",
    self: "http://localhost:3333/rest/api/3/issue/10101",
    fields: {
      summary: "Second test issue",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is the second test issue." }],
          },
        ],
      },
      status: {
        id: "10001",
        name: "In Progress",
        statusCategory: {
          id: 4,
          key: "indeterminate",
          name: "In Progress",
          colorName: "yellow",
        },
      },
      assignee: MOCK_USERS["jane-smith"],
      reporter: MOCK_USERS["john-doe"],
      priority: {
        id: "2",
        name: "High",
        iconUrl: "http://localhost:3333/icons/priority-high.png",
      },
      issuetype: {
        id: "10002",
        name: "Bug",
        description: "A problem that needs to be fixed",
        iconUrl: "http://localhost:3333/icons/bug.png",
        subtask: false,
      },
      project: {
        id: MOCK_PROJECTS.TEST!.id,
        key: MOCK_PROJECTS.TEST!.key,
        name: MOCK_PROJECTS.TEST!.name,
        projectTypeKey: MOCK_PROJECTS.TEST!.projectTypeKey,
      },
      labels: ["frontend", "critical"],
      components: [{ id: "10002", name: "Frontend" }],
      fixVersions: [
        {
          id: "10100",
          name: "v1.0.0",
          description: "First release",
          released: false,
          releaseDate: "2024-06-01",
        },
      ],
      created: "2024-01-16T09:15:00.000+0000",
      updated: "2024-01-16T16:45:00.000+0000",
      resolution: null,
      resolutiondate: null,
    },
  },
  "DEMO-1": {
    id: "10200",
    key: "DEMO-1",
    self: "http://localhost:3333/rest/api/3/issue/10200",
    fields: {
      summary: "Demo issue",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Demo issue for testing." }],
          },
        ],
      },
      status: {
        id: "10002",
        name: "Done",
        statusCategory: {
          id: 3,
          key: "done",
          name: "Done",
          colorName: "green",
        },
      },
      assignee: MOCK_USERS["test-user"],
      reporter: MOCK_USERS["jane-smith"],
      priority: {
        id: "4",
        name: "Low",
        iconUrl: "http://localhost:3333/icons/priority-low.png",
      },
      issuetype: {
        id: "10001",
        name: "Task",
        description: "A task that needs to be done",
        iconUrl: "http://localhost:3333/icons/task.png",
        subtask: false,
      },
      project: {
        id: MOCK_PROJECTS.DEMO!.id,
        key: MOCK_PROJECTS.DEMO!.key,
        name: MOCK_PROJECTS.DEMO!.name,
        projectTypeKey: MOCK_PROJECTS.DEMO!.projectTypeKey,
      },
      labels: ["documentation"],
      components: [],
      fixVersions: [],
      created: "2024-01-10T08:00:00.000+0000",
      updated: "2024-01-14T17:30:00.000+0000",
      resolution: {
        id: "10000",
        name: "Done",
        description: "Work has been completed",
      },
      resolutiondate: "2024-01-14T17:30:00.000+0000",
    },
  },
};

export const MOCK_TRANSITIONS: Record<string, Transition[]> = {
  "TEST-1": [
    {
      id: "11",
      name: "Start Progress",
      to: {
        id: "10001",
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
      id: "21",
      name: "Done",
      to: {
        id: "10002",
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
  ],
  "TEST-2": [
    {
      id: "31",
      name: "Stop Progress",
      to: {
        id: "10000",
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
      name: "Done",
      to: {
        id: "10002",
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
  ],
  "DEMO-1": [],
};

export const MOCK_BOARDS: Record<number, Board> = {
  1: {
    id: 1,
    self: "http://localhost:3333/rest/agile/1.0/board/1",
    name: "TEST Board",
    type: "scrum",
    location: {
      projectId: 10000,
      projectKey: "TEST",
      projectName: "Test Project",
      projectTypeKey: "software",
      displayName: "Test Project",
      name: "TEST",
    },
  },
  2: {
    id: 2,
    self: "http://localhost:3333/rest/agile/1.0/board/2",
    name: "DEMO Board",
    type: "kanban",
    location: {
      projectId: 10001,
      projectKey: "DEMO",
      projectName: "Demo Project",
      projectTypeKey: "business",
      displayName: "Demo Project",
      name: "DEMO",
    },
  },
};

export const MOCK_SPRINTS: Record<number, Sprint[]> = {
  1: [
    {
      id: 1,
      self: "http://localhost:3333/rest/agile/1.0/sprint/1",
      state: "active",
      name: "Sprint 1",
      startDate: "2024-01-15T00:00:00.000Z",
      endDate: "2024-01-29T23:59:59.999Z",
      originBoardId: 1,
      goal: "Complete initial features",
    },
    {
      id: 2,
      self: "http://localhost:3333/rest/agile/1.0/sprint/2",
      state: "future",
      name: "Sprint 2",
      startDate: "2024-01-30T00:00:00.000Z",
      endDate: "2024-02-13T23:59:59.999Z",
      originBoardId: 1,
      goal: "Continue development",
    },
  ],
  2: [
    {
      id: 3,
      self: "http://localhost:3333/rest/agile/1.0/sprint/3",
      state: "closed",
      name: "Demo Sprint 1",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-01-14T23:59:59.999Z",
      completeDate: "2024-01-14T18:00:00.000Z",
      originBoardId: 2,
      goal: "Demo sprint goals",
    },
  ],
};

let issueCounter = Object.keys(MOCK_ISSUES).length + 1;

export function createMockIssue(fields: any, baseUrl: string = "http://localhost:3333"): { id: string; key: string; self: string } {
  const projectKey = fields.project.key;
  const issueKey = `${projectKey}-${issueCounter}`;
  const issueId = `${10000 + issueCounter}`;
  issueCounter++;

  const newIssue: Issue = {
    id: issueId,
    key: issueKey,
    self: `${baseUrl}/rest/api/3/issue/${issueId}`,
    fields: {
      summary: fields.summary,
      description: fields.description || null,
      status: {
        id: "10000",
        name: "To Do",
        statusCategory: {
          id: 2,
          key: "new",
          name: "To Do",
          colorName: "blue-gray",
        },
      },
      assignee: fields.assignee ? MOCK_USERS["test-user"] : null,
      reporter: MOCK_USERS["test-user"],
      priority: fields.priority || {
        id: "3",
        name: "Medium",
      },
      issuetype: {
        id: "10001",
        name: fields.issuetype.name || "Task",
        subtask: false,
      },
      project: MOCK_PROJECTS[projectKey]
        ? {
            id: MOCK_PROJECTS[projectKey].id,
            key: MOCK_PROJECTS[projectKey].key,
            name: MOCK_PROJECTS[projectKey].name,
            projectTypeKey: MOCK_PROJECTS[projectKey].projectTypeKey,
          }
        : {
            id: "10000",
            key: projectKey,
            name: projectKey,
            projectTypeKey: "software",
          },
      labels: fields.labels || [],
      components: fields.components || [],
      fixVersions: fields.fixVersions || [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      resolution: null,
      resolutiondate: null,
      parent: fields.parent || undefined,
    },
  };

  MOCK_ISSUES[issueKey] = newIssue;

  MOCK_TRANSITIONS[issueKey] = [
    {
      id: "11",
      name: "Start Progress",
      to: {
        id: "10001",
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
      id: "21",
      name: "Done",
      to: {
        id: "10002",
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

  return {
    id: issueId,
    key: issueKey,
    self: newIssue.self,
  };
}

export function resetMockData(): void {
  issueCounter = 3;
  Object.keys(MOCK_ISSUES).forEach((key) => {
    if (!["TEST-1", "TEST-2", "DEMO-1"].includes(key)) {
      delete MOCK_ISSUES[key];
    }
  });
  Object.keys(MOCK_TRANSITIONS).forEach((key) => {
    if (!["TEST-1", "TEST-2", "DEMO-1"].includes(key)) {
      delete MOCK_TRANSITIONS[key];
    }
  });
}
