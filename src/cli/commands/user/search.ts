import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { UserEndpoint } from "../../../api/endpoints/user.ts";
import {
  output,
  outputError,
  TableFormatter,
  type OutputFormat,
  type TableColumn,
} from "../../../output/index.ts";
import type { User } from "../../../api/types/user.ts";

const USER_COLUMNS: TableColumn[] = [
  { key: "accountId", header: "Account ID", width: 28 },
  { key: "displayName", header: "Display Name", width: 30 },
  { key: "email", header: "Email", width: 30 },
  { key: "active", header: "Active", width: 8 },
];

function formatUsersForOutput(users: User[]) {
  return users.map((user) => ({
    accountId: user.accountId,
    displayName: truncate(user.displayName, 28),
    email: user.emailAddress ?? "-",
    active: user.active ? "Yes" : "No",
    emailAddress: user.emailAddress,
  }));
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

export const searchCommand = new Command("search")
  .alias("find")
  .description("Search for Jira users")
  .argument("<query>", "Search query string")
  .option("--limit <n>", "Maximum number of results", "50")
  .option("--start-at <n>", "Starting index for pagination", "0")
  .action(async function (this: Command, query: string, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      if (!query || query.trim() === "") {
        throw new Error("Search query is required");
      }

      const limit = parseInt(opts["limit"] as string, 10);
      if (isNaN(limit) || limit < 1) {
        throw new Error("Limit must be a positive number");
      }
      if (limit > 1000) {
        throw new Error("Limit must not exceed 1000");
      }

      const startAt = parseInt(opts["startAt"] as string, 10);
      if (isNaN(startAt) || startAt < 0) {
        throw new Error("Start-at must be a non-negative number");
      }

      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const userEndpoint = new UserEndpoint(client);

      if (globalOpts["debug"]) {
        console.log(chalk.dim(`Searching for users: ${query}`));
        console.log(chalk.dim(`Limit: ${limit}, Start-at: ${startAt}\n`));
      }

      const users = await userEndpoint.search(query, {
        maxResults: limit,
        startAt: startAt,
      });

      const formatted = formatUsersForOutput(users);

      if (format === "table") {
        const tableFormatter = new TableFormatter(USER_COLUMNS);
        const outputStr = tableFormatter.format(
          { data: formatted, meta: { total: users.length } },
          { colors: globalOpts["color"] !== false }
        );
        console.log(outputStr);

        if (users.length === limit) {
          console.log(
            chalk.dim(`\nShowing ${users.length} users. Use --start-at to see more results.`)
          );
        }
      } else {
        output(formatted, format, {
          meta: {
            total: users.length,
            maxResults: limit,
            startAt: startAt,
          },
        });
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
