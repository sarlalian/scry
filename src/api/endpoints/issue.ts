import type { JiraClient } from "../client.ts";
import type {
  Issue,
  SearchResult,
  CreateIssueRequest,
  CreatedIssue,
  Transition,
  Comment,
  Worklog,
  IssueLinkType,
  IssueLink,
} from "../types/issue.ts";
import type { AtlassianDocument } from "../types/common.ts";
import { textToAdf } from "../../utils/adf-helpers.ts";

export interface SearchOptions {
  maxResults?: number;
  /** @deprecated Use nextPageToken for pagination with /rest/api/3/search/jql */
  startAt?: number;
  fields?: string[];
  expand?: string[];
  nextPageToken?: string;
}

export interface GetIssueOptions {
  fields?: string[];
  expand?: string[];
}

export interface TransitionOptions {
  fields?: Record<string, unknown>;
  update?: Record<string, unknown>;
}

export interface CommentOptions {
  visibility?: {
    type: "group" | "role";
    value: string;
  };
}

export interface WorklogOptions {
  comment?: string;
  started?: string;
}

export interface CloneOptions {
  summary?: string;
  project?: string;
  description?: boolean;
  labels?: string[];
  components?: Array<{ name: string } | { id: string }>;
  priority?: { name: string } | { id: string };
}

const DEFAULT_FIELDS = [
  "summary",
  "status",
  "assignee",
  "reporter",
  "priority",
  "issuetype",
  "project",
  "labels",
  "components",
  "fixVersions",
  "created",
  "updated",
  "resolution",
  "parent",
];

export class IssueEndpoint {
  constructor(private client: JiraClient) {}

  async search(jql: string, options?: SearchOptions): Promise<SearchResult> {
    const body: Record<string, unknown> = {
      jql,
      maxResults: options?.maxResults ?? 50,
      fields: options?.fields ?? DEFAULT_FIELDS,
    };

    // The /rest/api/3/search/jql endpoint uses nextPageToken for pagination
    // instead of the deprecated startAt parameter
    if (options?.nextPageToken) {
      body.nextPageToken = options.nextPageToken;
    }

    return this.client.post<SearchResult>("/rest/api/3/search/jql", body);
  }

  async get(issueIdOrKey: string, options?: GetIssueOptions): Promise<Issue> {
    const params: Record<string, string | undefined> = {};
    if (options?.fields) {
      params["fields"] = options.fields.join(",");
    }
    if (options?.expand) {
      params["expand"] = options.expand.join(",");
    }
    return this.client.get<Issue>(`/rest/api/3/issue/${issueIdOrKey}`, params);
  }

  async create(fields: CreateIssueRequest): Promise<CreatedIssue> {
    return this.client.post<CreatedIssue>("/rest/api/3/issue", { fields });
  }

  async update(issueIdOrKey: string, fields: Partial<CreateIssueRequest>): Promise<void> {
    return this.client.put<void>(`/rest/api/3/issue/${issueIdOrKey}`, {
      fields,
    });
  }

  async delete(issueIdOrKey: string, deleteSubtasks = false): Promise<void> {
    return this.client.delete<void>(
      `/rest/api/3/issue/${issueIdOrKey}?deleteSubtasks=${deleteSubtasks}`
    );
  }

  async getTransitions(issueIdOrKey: string): Promise<Transition[]> {
    const result = await this.client.get<{ transitions: Transition[] }>(
      `/rest/api/3/issue/${issueIdOrKey}/transitions`
    );
    return result.transitions;
  }

  async transition(
    issueIdOrKey: string,
    transitionId: string,
    options?: TransitionOptions
  ): Promise<void> {
    return this.client.post<void>(`/rest/api/3/issue/${issueIdOrKey}/transitions`, {
      transition: { id: transitionId },
      fields: options?.fields,
      update: options?.update,
    });
  }

  async assign(issueIdOrKey: string, accountId: string | null): Promise<void> {
    return this.client.put<void>(`/rest/api/3/issue/${issueIdOrKey}/assignee`, {
      accountId,
    });
  }

  async addComment(
    issueIdOrKey: string,
    body: string | AtlassianDocument,
    options?: CommentOptions
  ): Promise<Comment> {
    const adfBody = typeof body === "string" ? textToAdf(body) : body;

    return this.client.post<Comment>(`/rest/api/3/issue/${issueIdOrKey}/comment`, {
      body: adfBody,
      visibility: options?.visibility,
    });
  }

  async addWorklog(
    issueIdOrKey: string,
    timeSpent: string,
    options?: WorklogOptions
  ): Promise<Worklog> {
    const body: Record<string, unknown> = { timeSpent };

    if (options?.comment) {
      body["comment"] = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: options.comment }],
          },
        ],
      };
    }

    if (options?.started) {
      body["started"] = options.started;
    }

    return this.client.post<Worklog>(`/rest/api/3/issue/${issueIdOrKey}/worklog`, body);
  }

  async link(outwardIssue: string, inwardIssue: string, linkType: string): Promise<void> {
    return this.client.post<void>("/rest/api/3/issueLink", {
      outwardIssue: { key: outwardIssue },
      inwardIssue: { key: inwardIssue },
      type: { name: linkType },
    });
  }

  async unlink(linkId: string): Promise<void> {
    return this.client.delete<void>(`/rest/api/3/issueLink/${linkId}`);
  }

  async getLinkTypes(): Promise<IssueLinkType[]> {
    const result = await this.client.get<{ issueLinkTypes: IssueLinkType[] }>(
      "/rest/api/3/issueLinkType"
    );
    return result.issueLinkTypes;
  }

  async getLinks(issueIdOrKey: string): Promise<IssueLink[]> {
    const issue = await this.get(issueIdOrKey, { fields: ["issuelinks"] });
    return (issue.fields.issuelinks as IssueLink[]) || [];
  }

  async clone(issueIdOrKey: string, options?: CloneOptions): Promise<CreatedIssue> {
    const original = await this.get(issueIdOrKey, {
      fields: [
        "summary",
        "description",
        "issuetype",
        "project",
        "labels",
        "components",
        "priority",
      ],
    });
    const cloneFields: CreateIssueRequest = {
      project: { key: options?.project ?? original.fields.project.key },
      issuetype: { name: original.fields.issuetype.name },
      summary: options?.summary ?? `Clone of ${original.fields.summary}`,
    };

    if (options?.description !== false && original.fields.description) {
      cloneFields.description = original.fields.description;
    }

    if (options?.components) {
      cloneFields.components = options.components;
    } else if (original.fields.components && original.fields.components.length > 0) {
      cloneFields.components = original.fields.components.map((c) => ({ id: c.id }));
    }

    if (options?.priority) {
      cloneFields.priority = options.priority;
    } else if (original.fields.priority) {
      cloneFields.priority = { id: original.fields.priority.id };
    }

    if (options?.labels) {
      cloneFields.labels = [...(original.fields.labels || []), ...options.labels];
    } else {
      cloneFields.labels = original.fields.labels;
    }

    return this.create(cloneFields);
  }
}
