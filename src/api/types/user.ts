export interface User {
  accountId: string;
  accountType?: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
  active: boolean;
  timeZone?: string;
  locale?: string;
  self?: string;
}

export interface UserSearchResult {
  users: User[];
  total: number;
  isLast: boolean;
}
