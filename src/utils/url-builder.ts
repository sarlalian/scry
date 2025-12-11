export type ResourceType = "issue" | "project" | "board" | "sprint" | "unknown";

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function detectResourceType(input: string): ResourceType {
  if (/^[A-Z][A-Z0-9]+-\d+$/i.test(input)) {
    return "issue";
  }
  if (/^[A-Z][A-Z0-9]+$/i.test(input)) {
    return "project";
  }
  return "unknown";
}

export function buildIssueUrl(baseUrl: string, key: string): string {
  return `${normalizeBaseUrl(baseUrl)}/browse/${key}`;
}

export function buildProjectUrl(baseUrl: string, key: string): string {
  return `${normalizeBaseUrl(baseUrl)}/browse/${key}`;
}

export function buildBoardUrl(baseUrl: string, id: number | string): string {
  return `${normalizeBaseUrl(baseUrl)}/secure/RapidBoard.jspa?rapidView=${id}`;
}

export function buildSprintUrl(
  baseUrl: string,
  boardId: number | string,
  sprintId: number | string
): string {
  return `${normalizeBaseUrl(baseUrl)}/secure/RapidBoard.jspa?rapidView=${boardId}&sprint=${sprintId}`;
}
