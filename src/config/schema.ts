export type AuthType = "basic" | "bearer";

export interface AuthConfig {
  type: AuthType;
  token?: string;
}

export interface ProjectConfig {
  key?: string;
  type?: "classic" | "next-gen";
}

export interface BoardConfig {
  id?: number;
  type?: "scrum" | "kanban";
}

export interface EpicConfig {
  name?: string;
  link?: string;
}

export interface IssueTypeConfig {
  name: string;
  handle: string;
}

export interface IssueConfig {
  types?: IssueTypeConfig[];
}

export interface OutputConfig {
  format?: "table" | "plain" | "json" | "xml" | "csv";
  colors?: boolean;
}

export interface ConfigSchema {
  server?: string;
  login?: string;
  project?: ProjectConfig;
  board?: BoardConfig;
  auth?: AuthConfig;
  epic?: EpicConfig;
  issue?: IssueConfig;
  output?: OutputConfig;
}

export interface Config {
  server: string;
  login: string;
  project: ProjectConfig;
  board: BoardConfig;
  auth: AuthConfig;
  epic: EpicConfig;
  issue: IssueConfig;
  output: OutputConfig;
}

export function validateConfig(config: ConfigSchema): string[] {
  const errors: string[] = [];

  if (!config.server) {
    errors.push("server is required");
  }

  if (!config.login) {
    errors.push("login is required");
  }

  if (config.auth?.type && !["basic", "bearer"].includes(config.auth.type)) {
    errors.push("auth.type must be 'basic' or 'bearer'");
  }

  if (config.board?.type && !["scrum", "kanban"].includes(config.board.type)) {
    errors.push("board.type must be 'scrum' or 'kanban'");
  }

  if (config.project?.type && !["classic", "next-gen"].includes(config.project.type)) {
    errors.push("project.type must be 'classic' or 'next-gen'");
  }

  return errors;
}

export function getDefaultConfig(): Config {
  return {
    server: "",
    login: "",
    project: {},
    board: {},
    auth: { type: "basic" },
    epic: {},
    issue: {
      types: [
        { name: "Story", handle: "Story" },
        { name: "Bug", handle: "Bug" },
        { name: "Task", handle: "Task" },
        { name: "Epic", handle: "Epic" },
        { name: "Sub-task", handle: "Sub-task" },
      ],
    },
    output: {
      format: "table",
      colors: true,
    },
  };
}
