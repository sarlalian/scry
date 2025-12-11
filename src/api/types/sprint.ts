export interface Sprint {
  id: number;
  self: string;
  state: SprintState;
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  activatedDate?: string;
  originBoardId?: number;
  goal?: string;
}

export type SprintState = "active" | "closed" | "future";

export interface SprintListResult {
  maxResults: number;
  startAt: number;
  isLast: boolean;
  values: Sprint[];
}

export interface SprintListOptions {
  startAt?: number;
  maxResults?: number;
  state?: SprintState;
}

export interface CreateSprintRequest {
  name: string;
  startDate?: string;
  endDate?: string;
  originBoardId: number;
  goal?: string;
}
