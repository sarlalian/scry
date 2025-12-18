import { Command } from "commander";
import { input, editor } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { SprintEndpoint } from "../../../api/endpoints/sprint.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { CreateSprintRequest, Sprint } from "../../../api/types/sprint.ts";
import { success } from "../../../utils/messages.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

function parseDate(dateStr?: string): string | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return date.toISOString();
}

function formatCreatedSprint(sprint: Sprint, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    return (
      success("Sprint created successfully!") +
      "\n" +
      chalk.cyan(`ID: ${sprint.id}\n`) +
      chalk.cyan(`Name: ${sprint.name}\n`) +
      chalk.cyan(`State: ${sprint.state.toUpperCase()}\n`) +
      (sprint.startDate ? chalk.dim(`Start Date: ${sprint.startDate.split("T")[0]}\n`) : "") +
      (sprint.endDate ? chalk.dim(`End Date: ${sprint.endDate.split("T")[0]}\n`) : "") +
      (sprint.goal ? chalk.dim(`Goal: ${sprint.goal}\n`) : "") +
      chalk.dim(`URL: ${sprint.self}`)
    );
  }
  return "";
}

export const createCommand = new Command("create")
  .alias("new")
  .description("Create a new sprint")
  .option("-b, --board-id <id>", "Board ID (required if not in config)")
  .option("-n, --name <name>", "Sprint name")
  .option(
    "-s, --start-date <date>",
    "Start date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)"
  )
  .option("-e, --end-date <date>", "End date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)")
  .option("-g, --goal <text>", "Sprint goal")
  .option("-i, --interactive", "Force interactive mode even if all flags provided");

addGlobalOptionsHelp(createCommand);

createCommand.action(async function (this: Command, opts) {
  const parent = this.parent?.parent;
  const globalOpts = parent?.opts() ?? {};
  const format = (globalOpts["output"] as OutputFormat) ?? "table";

  try {
    const configManager = getConfigManager();
    const config = configManager.load(globalOpts["config"] as string | undefined);
    const client = new JiraClient(config);
    const sprintEndpoint = new SprintEndpoint(client);

    let boardId: number | undefined;
    let name = opts["name"] as string | undefined;
    let startDate = opts["startDate"] as string | undefined;
    let endDate = opts["endDate"] as string | undefined;
    let goal = opts["goal"] as string | undefined;

    if (opts["boardId"]) {
      const parsed = parseInt(opts["boardId"] as string, 10);
      if (isNaN(parsed)) {
        throw new Error("Board ID must be a number");
      }
      boardId = parsed;
    } else if (config.board?.id) {
      boardId = config.board.id;
    }

    const needsInteractive = opts["interactive"] || !boardId || !name;

    if (needsInteractive) {
      if (format === "table" || format === "plain") {
        console.log(chalk.cyan("\nCreate a new sprint\n"));
      }

      if (!boardId) {
        const boardIdStr = await input({
          message: "Board ID:",
          default: config.board?.id?.toString() ?? "",
          validate: (value) => {
            if (!value.trim()) {
              return "Board ID is required";
            }
            const parsed = parseInt(value, 10);
            if (isNaN(parsed)) {
              return "Board ID must be a number";
            }
            return true;
          },
        });
        boardId = parseInt(boardIdStr, 10);
      }

      if (!name) {
        name = await input({
          message: "Sprint name:",
          validate: (value) => {
            if (!value.trim()) {
              return "Sprint name is required";
            }
            return true;
          },
        });
      }

      if (!startDate) {
        const shouldAddStartDate = await input({
          message: "Start date (YYYY-MM-DD or ISO 8601, press Enter to skip):",
        });

        if (shouldAddStartDate.trim()) {
          startDate = shouldAddStartDate;
        }
      }

      if (!endDate) {
        const shouldAddEndDate = await input({
          message: "End date (YYYY-MM-DD or ISO 8601, press Enter to skip):",
        });

        if (shouldAddEndDate.trim()) {
          endDate = shouldAddEndDate;
        }
      }

      if (!goal) {
        const shouldAddGoal = await input({
          message: "Sprint goal (press Enter to skip, or type text):",
        });

        if (shouldAddGoal.trim()) {
          goal = shouldAddGoal;
        } else {
          const useEditor = await input({
            message: "Open editor for longer goal? (y/N):",
          });

          if (useEditor.toLowerCase() === "y" || useEditor.toLowerCase() === "yes") {
            goal = await editor({
              message: "Enter sprint goal:",
            });
          }
        }
      }
    } else {
      if (!boardId) {
        throw new Error("Board ID is required. Use --board-id flag or configure default board.");
      }
    }

    if (!boardId || !name) {
      throw new Error("Missing required fields: board ID and name are required");
    }

    const request: CreateSprintRequest = {
      name,
      originBoardId: boardId,
    };

    if (startDate && startDate.trim()) {
      request.startDate = parseDate(startDate);
    }

    if (endDate && endDate.trim()) {
      request.endDate = parseDate(endDate);
    }

    if (goal && goal.trim()) {
      request.goal = goal;
    }

    if (globalOpts["debug"]) {
      console.log(chalk.dim("\nCreating sprint with request:"));
      console.log(chalk.dim(JSON.stringify(request, null, 2)));
      console.log("");
    }

    const createdSprint = await sprintEndpoint.create(request);

    if (format === "table" || format === "plain") {
      console.log(formatCreatedSprint(createdSprint, format));
    } else {
      output(createdSprint, format);
    }
  } catch (err) {
    outputError(err instanceof Error ? err : String(err), format);
    throw err;
  }
});
