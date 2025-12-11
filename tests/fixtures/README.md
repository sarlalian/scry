# Mock Jira Server

This directory contains a mock Jira server implementation for testing purposes. The mock server provides realistic responses for all major Jira API endpoints without requiring an actual Jira instance.

## Overview

The mock server is built using Bun.serve() and implements the following Jira REST API endpoints:

### User Endpoints
- `GET /rest/api/3/myself` - Get current user information

### Issue Endpoints
- `POST /rest/api/3/search/jql` - Search issues using JQL
- `GET /rest/api/3/issue/{key}` - Get issue by key
- `POST /rest/api/3/issue` - Create a new issue
- `PUT /rest/api/3/issue/{key}` - Update an issue
- `DELETE /rest/api/3/issue/{key}` - Delete an issue
- `GET /rest/api/3/issue/{key}/transitions` - Get available transitions
- `POST /rest/api/3/issue/{key}/transitions` - Execute a transition

### Project Endpoints
- `GET /rest/api/3/project/search` - Search projects
- `GET /rest/api/3/project/{key}` - Get project by key

### Board Endpoints (Agile)
- `GET /rest/agile/1.0/board` - List boards
- `GET /rest/agile/1.0/board/{id}` - Get board by ID

### Sprint Endpoints (Agile)
- `GET /rest/agile/1.0/board/{id}/sprint` - List sprints for a board

## Files

- **mock-server.ts** - The main mock server implementation
- **data.ts** - Fixture data (users, projects, issues, boards, sprints)
- **mock-server.test.ts** - Comprehensive tests for the mock server
- **example-usage.test.ts** - Examples showing how to use the mock server in integration tests

## Usage

### Basic Setup

```typescript
import { MockJiraServer } from "./tests/fixtures/mock-server.ts";
import { JiraClient } from "./src/api/client.ts";
import type { Config } from "./src/config/index.ts";

// Start the mock server
const server = new MockJiraServer(3333);
server.start();

// Configure the client to use the mock server
const config: Config = {
  server: server.getUrl(),
  login: "test@example.com",
  auth: {
    type: "basic",
    token: "test-token",
  },
  project: "TEST",
  installation: "cloud",
};

const client = new JiraClient(config);

// Use the client as normal
// ...

// Stop the server when done
server.stop();
```

### Using in Tests

```typescript
import { describe, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "./tests/fixtures/mock-server.ts";

describe("My Integration Tests", () => {
  let server: MockJiraServer;

  beforeAll(() => {
    server = new MockJiraServer(3333);
    server.start();
  });

  afterAll(() => {
    server.stop();
  });

  test("my test", async () => {
    // Your test code here
  });
});
```

## Authentication

The mock server supports both Basic and Bearer authentication:

### Basic Auth
```typescript
const credentials = btoa("email@example.com:api-token");
fetch(url, {
  headers: {
    Authorization: `Basic ${credentials}`,
  },
});
```

### Bearer Token
```typescript
fetch(url, {
  headers: {
    Authorization: `Bearer api-token`,
  },
});
```

All requests without authentication will return a 401 error.

## Fixture Data

The mock server comes with pre-populated data:

### Users
- `test-user` - Test User (test@example.com)
- `john-doe` - John Doe (john.doe@example.com)
- `jane-smith` - Jane Smith (jane.smith@example.com)

### Projects
- `TEST` - Test Project (software)
- `DEMO` - Demo Project (business)

### Issues
- `TEST-1` - First test issue (To Do)
- `TEST-2` - Second test issue (In Progress)
- `DEMO-1` - Demo issue (Done)

### Boards
- Board 1 - TEST Board (scrum)
- Board 2 - DEMO Board (kanban)

### Sprints
- Sprint 1 - Active sprint for TEST Board
- Sprint 2 - Future sprint for TEST Board
- Sprint 3 - Closed sprint for DEMO Board

## JQL Support

The mock server supports basic JQL filtering:

- `project = KEY` - Filter by project key
- `status = "Status Name"` - Filter by status
- `key = ISSUE-123` - Filter by specific issue key

Multiple filters can be combined in the JQL string.

## Dynamic Data

The mock server supports creating new issues dynamically:

```typescript
const created = await issueEndpoint.create({
  project: { key: "TEST" },
  issuetype: { name: "Task" },
  summary: "New issue",
  labels: ["test", "mock"],
});
```

Created issues are stored in memory and will be returned in subsequent searches and queries.

## Data Reset

When a mock server is stopped, all dynamically created data is reset to the original fixture data. This ensures each test run starts with a clean state.

## API Methods

### MockJiraServer

#### Constructor
```typescript
new MockJiraServer(port?: number)
```
Creates a new mock server instance. Default port is 3333.

#### Methods
- `start(): void` - Start the server
- `stop(): void` - Stop the server and reset data
- `isRunning(): boolean` - Check if server is running
- `getUrl(): string` - Get the base URL of the server

## Error Handling

The mock server returns proper error responses:

- 401 - Authentication required
- 404 - Resource not found
- 400 - Bad request (missing required fields)
- 500 - Internal server error

All errors follow the Jira API error response format:

```json
{
  "errorMessages": ["Error message here"]
}
```

## Extending the Mock Server

To add new endpoints:

1. Add a new handler method in `MockJiraServer` class
2. Add routing logic in the `handleRequest` method
3. Add fixture data to `data.ts` if needed
4. Write tests in `mock-server.test.ts`

## Testing

Run the mock server tests:

```bash
bun test tests/fixtures/mock-server.test.ts
```

Run the example usage tests:

```bash
bun test tests/fixtures/example-usage.test.ts
```

## Limitations

- JQL parsing is basic and only supports simple equality filters
- Some advanced Jira features are not implemented
- Pagination is supported but results are not persisted across restarts
- Transitions are mocked but don't enforce workflow rules
- Authentication validation is minimal (any valid format is accepted)

## Future Enhancements

Potential improvements for the mock server:

- More comprehensive JQL parsing
- Workflow validation for transitions
- Issue linking support
- Comment and worklog endpoints
- Attachment handling
- Field validation based on issue type
- Custom field support
- Webhook simulation
- Rate limiting simulation
