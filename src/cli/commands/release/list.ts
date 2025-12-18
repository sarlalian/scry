import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { VersionEndpoint } from "../../../api/endpoints/version.ts";
import {
  output,
  outputError,
  TableFormatter,
  type OutputFormat,
  type TableColumn,
} from "../../../output/index.ts";
import type { Version } from "../../../api/types/version.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

const RELEASE_COLUMNS: TableColumn[] = [
  { key: "id", header: "ID", width: 8 },
  { key: "name", header: "Name", width: 20 },
  { key: "status", header: "Status", width: 12 },
  { key: "releaseDate", header: "Release Date", width: 15 },
  { key: "description", header: "Description", width: 40 },
];

function formatStatus(version: Version): string {
  if (version.archived) return "archived";
  if (version.released) return "released";
  return "unreleased";
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

function formatVersionsForOutput(versions: Version[]) {
  return versions.map((version) => ({
    id: version.id,
    name: truncate(version.name, 18),
    status: formatStatus(version),
    releaseDate: version.releaseDate ?? "-",
    description: version.description ? truncate(version.description, 38) : "-",
  }));
}

export const listCommand = new Command("list")
  .alias("ls")
  .description("List releases/versions for a project")
  .argument("[project]", "Project key (defaults to config)")
  .option("-s, --status <status>", "Filter by status: released|unreleased|archived")
  .option("--order-by <field>", "Sort field (e.g., name, releaseDate)")
  .option("--limit <n>", "Maximum results", "50")
  .option("--start-at <n>", "Start at result number", "0")
  .option("--columns <cols>", "Columns to display (comma-separated)");

addGlobalOptionsHelp(listCommand);

listCommand.action(async function (this: Command, projectArg: string | undefined, opts) {
  const parent = this.parent?.parent;
  const globalOpts = parent?.opts() ?? {};
  const format = (globalOpts["output"] as OutputFormat) ?? "table";

  try {
    const configManager = getConfigManager();
    const config = configManager.load(globalOpts["config"] as string | undefined);
    const client = new JiraClient(config);
    const versionEndpoint = new VersionEndpoint(client);

    const projectKey = projectArg ?? globalOpts["project"] ?? config.project.key;
    if (!projectKey) {
      throw new Error(
        "Project key is required. Provide it as an argument, use --project flag, or set it in config."
      );
    }

    if (globalOpts["debug"]) {
      console.log(chalk.dim(`Project: ${projectKey}`));
      if (opts["status"]) {
        console.log(chalk.dim(`Status filter: ${opts["status"]}`));
      }
      if (opts["orderBy"]) {
        console.log(chalk.dim(`Order by: ${opts["orderBy"]}`));
      }
      console.log(chalk.dim(""));
    }

    const statusFilter = opts["status"] as string | undefined;
    let validStatus: "released" | "unreleased" | "archived" | undefined;

    if (statusFilter) {
      if (
        statusFilter === "released" ||
        statusFilter === "unreleased" ||
        statusFilter === "archived"
      ) {
        validStatus = statusFilter;
      } else {
        throw new Error(
          `Invalid status filter: ${statusFilter}. Valid values: released, unreleased, archived`
        );
      }
    }

    const result = await versionEndpoint.list(projectKey, {
      status: validStatus,
      orderBy: opts["orderBy"] as string | undefined,
      maxResults: parseInt(opts["limit"] as string, 10),
      startAt: parseInt(opts["startAt"] as string, 10),
    });

    const formatted = formatVersionsForOutput(result);

    if (format === "table") {
      const columns = opts["columns"]
        ? RELEASE_COLUMNS.filter((c) => (opts["columns"] as string).split(",").includes(c.key))
        : RELEASE_COLUMNS;

      const tableFormatter = new TableFormatter(columns);
      const outputStr = tableFormatter.format(
        {
          data: formatted,
          meta: {
            total: result.length,
          },
        },
        { colors: globalOpts["color"] !== false }
      );
      console.log(outputStr);

      if (result.length === 0) {
        console.log(chalk.dim("\nNo releases found"));
      } else {
        console.log(chalk.dim(`\nShowing ${result.length} release(s)`));
      }
    } else {
      output(formatted, format, {
        meta: {
          total: result.length,
        },
      });
    }
  } catch (err) {
    outputError(err instanceof Error ? err : String(err), format);
    throw err;
  }
});
