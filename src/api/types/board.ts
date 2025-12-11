export interface Board {
  id: number;
  self: string;
  name: string;
  type: BoardType;
  location?: {
    projectId?: number;
    projectKey?: string;
    projectName?: string;
    displayName?: string;
    projectTypeKey?: string;
    avatarURI?: string;
    name?: string;
  };
}

export type BoardType = "scrum" | "kanban" | "simple";

export interface BoardListResult {
  maxResults: number;
  startAt: number;
  total?: number;
  isLast: boolean;
  values: Board[];
}

export interface BoardListOptions {
  startAt?: number;
  maxResults?: number;
  type?: BoardType;
  name?: string;
  projectKeyOrId?: string;
}
