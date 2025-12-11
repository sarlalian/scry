import type { User } from "./user.ts";

export interface Project {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  self: string;
  lead?: User;
  description?: string;
  url?: string;
  avatarUrls?: Record<string, string>;
  style?: string;
  isPrivate?: boolean;
  archived?: boolean;
  deleted?: boolean;
}

export interface ProjectListResult {
  self: string;
  nextPage?: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Project[];
}

export interface ProjectListOptions {
  startAt?: number;
  maxResults?: number;
  orderBy?: string;
  query?: string;
}
