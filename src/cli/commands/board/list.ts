import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { BoardEndpoint } from "../../../api/endpoints/board.ts";
import {
  output,
  outputError,
  TableFormatter,
  type OutputFormat,
  type TableColumn,
} from "../../../output/index.ts";
import type { Board, BoardType } from "../../../api/types/board.ts";

const BOARD_COLUMNS: TableColumn[] = [
  { key: "id", header: "ID", width: 8 },
  { key: "name", header: "Name", width: 40 },
  { key: "type", header: "Type", width: 10 },
  { key: "projectKey", header: "Project", width: 12 },
];

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

function formatBoardsForOutput(boards: Board[]) {
  return boards.map((board) => ({
    id: board.id,
    name: truncate(board.name, 38),
    type: board.type.toUpperCase(),
    projectKey: board.location?.projectKey ?? "-",
  }));
}

export const listCommand = new Command("list")
  .alias("ls")
  .description("List all Jira boards")
  .option("-n, --name <pattern>", "Filter boards by name pattern")
  .option("-t, --type <type>", "Filter by board type (scrum, kanban, simple)")
  .option("-p, --project <key>", "Filter by project key or ID")
  .option("--limit <n>", "Maximum results", "50")
  .option("--start-at <n>", "Start at result number", "0")
  .option("--columns <cols>", "Columns to display (comma-separated)")
  .action(async function (this: Command, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const boardEndpoint = new BoardEndpoint(client);

      if (opts["type"]) {
        const validTypes: BoardType[] = ["scrum", "kanban", "simple"];
        const typeInput = (opts["type"] as string).toLowerCase();
        if (!validTypes.includes(typeInput as BoardType)) {
          throw new Error(`Type must be one of: ${validTypes.join(", ")}`);
        }
      }

      if (globalOpts["debug"]) {
        if (opts["name"]) {
          console.log(chalk.dim(`Name filter: ${opts["name"]}`));
        }
        if (opts["type"]) {
          console.log(chalk.dim(`Type filter: ${opts["type"]}`));
        }
        if (opts["project"]) {
          console.log(chalk.dim(`Project filter: ${opts["project"]}`));
        }
        console.log(chalk.dim(""));
      }

      const result = await boardEndpoint.list({
        name: opts["name"] as string | undefined,
        type: opts["type"] ? ((opts["type"] as string).toLowerCase() as BoardType) : undefined,
        projectKeyOrId: opts["project"] as string | undefined,
        maxResults: parseInt(opts["limit"] as string, 10),
        startAt: parseInt(opts["startAt"] as string, 10),
      });

      const formatted = formatBoardsForOutput(result.values);

      if (format === "table") {
        const columns = opts["columns"]
          ? BOARD_COLUMNS.filter((c) => (opts["columns"] as string).split(",").includes(c.key))
          : BOARD_COLUMNS;

        const tableFormatter = new TableFormatter(columns);
        const outputStr = tableFormatter.format(
          {
            data: formatted,
            meta: {
              total: result.total,
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
        } else if (result.total !== undefined && result.total > 0) {
          console.log(chalk.dim(`\nShowing ${result.values.length} of ${result.total} boards`));
        }
      } else {
        output(formatted, format, {
          meta: {
            total: result.total,
            maxResults: result.maxResults,
            startAt: result.startAt,
            isLast: result.isLast,
          },
        });
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      process.exit(1);
    }
  });
