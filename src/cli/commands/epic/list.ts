import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { JqlBuilder } from "../../../utils/jql.ts";
import {
  output,
  outputError,
  TableFormatter,
  type OutputFormat,
  type TableColumn,
} from "../../../output/index.ts";
import type { Issue } from "../../../api/types/issue.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

const EPIC_COLUMNS: TableColumn[] = [
  { key: "key", header: "Key", width: 12 },
  { key: "summary", header: "Summary", width: 50 },
  { key: "status", header: "Status", width: 14 },
  { key: "assignee", header: "Assignee", width: 18 },
  { key: "priority", header: "Pri", width: 8 },
];

function formatEpicsForOutput(epics: Issue[]) {
  return epics.map((epic) => ({
    key: epic.key,
    summary: truncate(epic.fields.summary, 48),
    status: epic.fields.status.name,
    assignee: epic.fields.assignee?.displayName ?? "-",
    priority: epic.fields.priority?.name ?? "-",
    labels: epic.fields.labels ?? [],
    created: epic.fields.created,
    updated: epic.fields.updated,
  }));
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

export const listCommand = new Command("list")
  .alias("ls")
  .description("List epics")
  .option("-a, --assignee <user>", "Filter by assignee (use 'x' for unassigned)")
  .option("-s, --status <status>", "Filter by status (prefix with ~ to exclude)")
  .option(
    "-l, --label <label>",
    "Filter by label (repeatable)",
    (val, prev: string[]) => prev.concat(val),
    []
  )
  .option("-q, --jql <query>", "Raw JQL query")
  .option("--created <period>", "Created time filter (e.g., -7d, week, month)")
  .option("--updated <period>", "Updated time filter")
  .option("--order-by <field>", "Sort field", "created")
  .option("--reverse", "Reverse sort order (ASC)")
  .option("--limit <n>", "Maximum results", "50")
  .option("--start-at <n>", "Start at result number", "0")
  .option("--columns <cols>", "Columns to display (comma-separated)");

addGlobalOptionsHelp(listCommand);

listCommand.action(async function (this: Command, opts) {
  const parent = this.parent?.parent;
  const globalOpts = parent?.opts() ?? {};
  const format = (globalOpts["output"] as OutputFormat) ?? "table";
  const projectKey = globalOpts["project"] as string | undefined;

  try {
    const configManager = getConfigManager();
    const config = configManager.load(globalOpts["config"] as string | undefined);
    const client = new JiraClient(config);
    const issueEndpoint = new IssueEndpoint(client);

    let jql: string;

    if (opts["jql"]) {
      jql = opts["jql"] as string;
    } else {
      const builder = new JqlBuilder();
      const project = projectKey ?? config.project.key;

      if (project) {
        builder.project(project);
      }

      builder.type("Epic");

      if (opts["assignee"]) {
        builder.assignee(opts["assignee"] as string);
      }

      if (opts["status"]) {
        builder.status(opts["status"] as string);
      }

      if (opts["label"] && (opts["label"] as string[]).length > 0) {
        builder.labels(opts["label"] as string[]);
      }

      if (opts["created"]) {
        builder.created(opts["created"] as string);
      }

      if (opts["updated"]) {
        builder.updated(opts["updated"] as string);
      }

      const orderDirection = opts["reverse"] ? "ASC" : "DESC";
      builder.orderBy(opts["orderBy"] as string, orderDirection);

      jql = builder.build();
    }

    if (globalOpts["debug"]) {
      console.log(chalk.dim(`JQL: ${jql}\n`));
    }

    const result = await issueEndpoint.search(jql, {
      maxResults: parseInt(opts["limit"] as string, 10),
      startAt: parseInt(opts["startAt"] as string, 10),
    });

    const formatted = formatEpicsForOutput(result.issues);

    if (format === "table") {
      const columns = opts["columns"]
        ? EPIC_COLUMNS.filter((c) => (opts["columns"] as string).split(",").includes(c.key))
        : EPIC_COLUMNS;

      const tableFormatter = new TableFormatter(columns);
      const outputStr = tableFormatter.format(
        { data: formatted, meta: { total: result.total, maxResults: result.maxResults } },
        { colors: globalOpts["color"] !== false }
      );
      console.log(outputStr);

      if (result.total && result.total > result.maxResults) {
        console.log(chalk.dim(`\nShowing ${result.issues.length} of ${result.total} epics`));
      }
    } else {
      output(formatted, format, {
        meta: {
          total: result.total,
          maxResults: result.maxResults,
          startAt: result.startAt,
        },
      });
    }
  } catch (err) {
    outputError(err instanceof Error ? err : String(err), format);
    throw err;
  }
});
