export interface Version {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  startDate?: string;
  releaseDate?: string;
  overdue?: boolean;
  userStartDate?: string;
  userReleaseDate?: string;
  projectId: number;
  self: string;
}

export interface VersionListOptions {
  status?: "released" | "unreleased" | "archived";
  orderBy?: string;
  maxResults?: number;
  startAt?: number;
}

export interface CreateVersionRequest {
  name: string;
  projectId: number;
  description?: string;
  releaseDate?: string;
  startDate?: string;
  archived?: boolean;
  released?: boolean;
}
