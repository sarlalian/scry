import { Command } from "commander";
import { listCommand } from "./list.ts";

export const projectCommand = new Command("project")
  .description("Manage Jira projects")
  .addCommand(listCommand);
