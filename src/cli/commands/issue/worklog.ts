import { Command } from "commander";
import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { Worklog } from "../../../api/types/issue.ts";
import { requireValidIssueKey } from "../../../utils/validation.ts";
import { success } from "../../../utils/messages.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

function validateTimeFormat(time: string): boolean {
  const timePattern = /^(\d+w)?(\d+d)?(\d+h)?(\d+m)?$/;
  return timePattern.test(time) && time.length > 0;
}

function formatWorklog(worklog: Worklog, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    let result =
      success("Worklog added successfully!") +
      "\n" +
      chalk.cyan(`ID: ${worklog.id}\n`) +
      chalk.dim(`Time Spent: ${worklog.timeSpent}\n`) +
      chalk.dim(`Author: ${worklog.author.displayName}\n`) +
      chalk.dim(`Started: ${worklog.started}`);

    if (worklog.comment) {
      const commentText = worklog.comment.content
        ?.map((node) => {
          if ("content" in node && Array.isArray(node.content)) {
            return node.content.map((c) => ("text" in c ? c.text : "")).join("");
          }
          return "";
        })
        .join("\n");
      if (commentText) {
        result += chalk.dim(`\nComment: ${commentText}`);
      }
    }

    return result;
  }
  return "";
}

const addWorklogCommand = new Command("add")
  .description("Add a worklog entry to an issue")
  .argument("<issueKey>", "Issue key (e.g., PROJ-123)")
  .option("-t, --time <duration>", "Time spent (e.g., 2h, 30m, 1d, 1w)")
  .option("-c, --comment <text>", "Comment or description for the worklog")
  .option("-s, --started <datetime>", "Start time in ISO 8601 format (e.g., 2024-01-15T09:00:00)");

addGlobalOptionsHelp(addWorklogCommand);

addWorklogCommand.action(async function (this: Command, issueKey: string, opts) {
  const parent = this.parent?.parent?.parent;
  const globalOpts = parent?.opts() ?? {};
  const format = (globalOpts["output"] as OutputFormat) ?? "table";

  try {
    requireValidIssueKey(issueKey);

    const configManager = getConfigManager();
    const config = configManager.load(globalOpts["config"] as string | undefined);
    const client = new JiraClient(config);
    const issueEndpoint = new IssueEndpoint(client);

    let timeSpent = opts["time"] as string | undefined;

    if (!timeSpent) {
      timeSpent = await input({
        message: "Time spent (e.g., 2h, 30m, 1d, 1w):",
        validate: (value) => {
          if (!value.trim()) {
            return "Time spent is required";
          }
          if (!validateTimeFormat(value.trim())) {
            return "Invalid time format. Use formats like: 2h, 30m, 1d, 1w, or combinations like 1d4h30m";
          }
          return true;
        },
      });
    }

    if (!timeSpent || !timeSpent.trim()) {
      throw new Error("Time spent is required");
    }

    timeSpent = timeSpent.trim();

    if (!validateTimeFormat(timeSpent)) {
      throw new Error(
        "Invalid time format. Use formats like: 2h, 30m, 1d, 1w, or combinations like 1d4h30m"
      );
    }

    const worklogOptions: { comment?: string; started?: string } = {};

    if (opts["comment"]) {
      worklogOptions.comment = opts["comment"] as string;
    }

    if (opts["started"]) {
      worklogOptions.started = opts["started"] as string;
    }

    if (globalOpts["debug"]) {
      console.log(chalk.dim(`\nAdding worklog to issue: ${issueKey}`));
      console.log(chalk.dim(`Time spent: ${timeSpent}`));
      if (worklogOptions.comment) {
        console.log(chalk.dim(`Comment: ${worklogOptions.comment}`));
      }
      if (worklogOptions.started) {
        console.log(chalk.dim(`Started: ${worklogOptions.started}`));
      }
      console.log("");
    }

    const worklog = await issueEndpoint.addWorklog(issueKey, timeSpent, worklogOptions);

    if (format === "table" || format === "plain") {
      console.log(formatWorklog(worklog, format));
    } else {
      output(worklog, format);
    }
  } catch (err) {
    outputError(err instanceof Error ? err : String(err), format);
    throw err;
  }
});

export const worklogCommand = new Command("worklog")
  .description("Manage issue worklogs")
  .addCommand(addWorklogCommand);
