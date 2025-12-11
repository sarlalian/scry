import { Command } from "commander";
import { searchCommand } from "./search.ts";

export const userCommand = new Command("user")
  .description("Manage Jira users")
  .addCommand(searchCommand);
