import type { AtlassianDocument } from "./common.ts";
import type { User } from "./user.ts";

export interface Issue {
  id: string;
  key: string;
  self: string;
  fields: IssueFields;
}

export interface IssueFields {
  summary: string;
  description?: AtlassianDocument | null;
  status: Status;
  assignee?: User | null;
  reporter?: User | null;
  priority?: Priority | null;
  issuetype: IssueType;
  project: ProjectRef;
  labels?: string[];
  components?: Component[];
  fixVersions?: Version[];
  created: string;
  updated: string;
  resolution?: Resolution | null;
  resolutiondate?: string | null;
  parent?: ParentIssue;
  subtasks?: Issue[];
  comment?: {
    comments: Comment[];
    total: number;
  };
  worklog?: {
    worklogs: Worklog[];
    total: number;
  };
  [key: string]: unknown;
}

export interface Status {
  id: string;
  name: string;
  description?: string;
  statusCategory: StatusCategory;
}

export interface StatusCategory {
  id: number;
  key: string;
  name: string;
  colorName: string;
}

export interface Priority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface IssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
}

export interface ProjectRef {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
}

export interface Version {
  id: string;
  name: string;
  description?: string;
  released: boolean;
  releaseDate?: string;
}

export interface Resolution {
  id: string;
  name: string;
  description?: string;
}

export interface ParentIssue {
  id: string;
  key: string;
  fields?: {
    summary: string;
    status?: Status;
    issuetype?: IssueType;
  };
}

export interface Comment {
  id: string;
  author: User;
  body: AtlassianDocument;
  created: string;
  updated: string;
}

export interface Worklog {
  id: string;
  author: User;
  comment?: AtlassianDocument;
  timeSpent: string;
  timeSpentSeconds: number;
  started: string;
}

export interface Transition {
  id: string;
  name: string;
  to: Status;
  hasScreen: boolean;
  isAvailable: boolean;
}

export interface SearchResult {
  issues: Issue[];
  maxResults: number;
  /** @deprecated The /rest/api/3/search/jql endpoint uses nextPageToken for pagination */
  startAt?: number;
  total?: number;
  isLast?: boolean;
  nextPageToken?: string;
}

export interface CreateIssueRequest {
  project: { key: string } | { id: string };
  issuetype: { name: string } | { id: string };
  summary: string;
  description?: AtlassianDocument;
  assignee?: { accountId: string };
  reporter?: { accountId: string };
  priority?: { name: string } | { id: string };
  labels?: string[];
  components?: Array<{ name: string } | { id: string }>;
  fixVersions?: Array<{ name: string } | { id: string }>;
  parent?: { key: string } | null;
  [key: string]: unknown;
}

export interface CreatedIssue {
  id: string;
  key: string;
  self: string;
}

export interface IssueLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
  self: string;
}

export interface IssueLink {
  id: string;
  type: IssueLinkType;
  inwardIssue?: {
    id: string;
    key: string;
    self: string;
    fields?: {
      summary: string;
      status: Status;
      priority?: Priority;
      issuetype: IssueType;
    };
  };
  outwardIssue?: {
    id: string;
    key: string;
    self: string;
    fields?: {
      summary: string;
      status: Status;
      priority?: Priority;
      issuetype: IssueType;
    };
  };
}
