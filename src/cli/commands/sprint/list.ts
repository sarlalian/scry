import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { SprintEndpoint } from "../../../api/endpoints/sprint.ts";
import {
  output,
  outputError,
  TableFormatter,
  type OutputFormat,
  type TableColumn,
} from "../../../output/index.ts";
import type { Sprint, SprintState } from "../../../api/types/sprint.ts";

const SPRINT_COLUMNS: TableColumn[] = [
  { key: "id", header: "ID", width: 8 },
  { key: "name", header: "Name", width: 30 },
  { key: "state", header: "State", width: 10 },
  { key: "startDate", header: "Start Date", width: 12 },
  { key: "endDate", header: "End Date", width: 12 },
  { key: "goal", header: "Goal", width: 40 },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return dateStr.split("T")[0] ?? "-";
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

function formatSprintsForOutput(sprints: Sprint[]) {
  return sprints.map((sprint) => ({
    id: sprint.id,
    name: truncate(sprint.name, 28),
    state: sprint.state.toUpperCase(),
    startDate: formatDate(sprint.startDate),
    endDate: formatDate(sprint.endDate),
    goal: sprint.goal ? truncate(sprint.goal, 38) : "-",
  }));
}

export const listCommand = new Command("list")
  .alias("ls")
  .description("List sprints from a board")
  .option("-b, --board-id <id>", "Board ID (required if not in config)")
  .option("-s, --state <state>", "Filter by state (active, closed, future)")
  .option("--start-at <n>", "Start index for pagination", "0")
  .option("--limit <n>", "Maximum results", "50")
  .option("--columns <cols>", "Columns to display (comma-separated)")
  .action(async function (this: Command, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const sprintEndpoint = new SprintEndpoint(client);

      let boardId: number;
      if (opts["boardId"]) {
        const parsed = parseInt(opts["boardId"] as string, 10);
        if (isNaN(parsed)) {
          throw new Error("Board ID must be a number");
        }
        boardId = parsed;
      } else if (config.board.id) {
        boardId = config.board.id;
      } else {
        throw new Error(
          "Board ID is required. Use --board-id or configure default board in config"
        );
      }

      if (opts["state"]) {
        const validStates: SprintState[] = ["active", "closed", "future"];
        if (!validStates.includes(opts["state"] as SprintState)) {
          throw new Error(`State must be one of: ${validStates.join(", ")}`);
        }
      }

      if (globalOpts["debug"]) {
        console.log(chalk.dim(`Board ID: ${boardId}`));
        if (opts["state"]) {
          console.log(chalk.dim(`State filter: ${opts["state"]}\n`));
        } else {
          console.log(chalk.dim("State filter: all\n"));
        }
      }

      const result = await sprintEndpoint.list(boardId, {
        state: opts["state"] as SprintState | undefined,
        startAt: parseInt(opts["startAt"] as string, 10),
        maxResults: parseInt(opts["limit"] as string, 10),
      });

      const formatted = formatSprintsForOutput(result.values);

      if (format === "table") {
        const columns = opts["columns"]
          ? SPRINT_COLUMNS.filter((c) => (opts["columns"] as string).split(",").includes(c.key))
          : SPRINT_COLUMNS;

        const tableFormatter = new TableFormatter(columns);
        const outputStr = tableFormatter.format(
          {
            data: formatted,
            meta: {
              maxResults: result.maxResults,
              startAt: result.startAt,
              isLast: result.isLast,
            },
          },
          { colors: globalOpts["color"] !== false }
        );
        console.log(outputStr);

        if (!result.isLast) {
          console.log(
            chalk.dim(
              `\nShowing ${result.values.length} results. Use --start-at ${
                result.startAt + result.maxResults
              } for more`
            )
          );
        }
      } else {
        output(formatted, format, {
          meta: {
            maxResults: result.maxResults,
            startAt: result.startAt,
            isLast: result.isLast,
          },
        });
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
