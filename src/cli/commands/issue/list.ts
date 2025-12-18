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

const ISSUE_COLUMNS: TableColumn[] = [
  { key: "key", header: "Key", width: 12 },
  { key: "summary", header: "Summary", width: 50 },
  { key: "status", header: "Status", width: 14 },
  { key: "assignee", header: "Assignee", width: 18 },
  { key: "priority", header: "Pri", width: 8 },
  { key: "type", header: "Type", width: 10 },
];

function formatIssuesForOutput(issues: Issue[]) {
  return issues.map((issue) => ({
    key: issue.key,
    summary: truncate(issue.fields.summary, 48),
    status: issue.fields.status.name,
    assignee: issue.fields.assignee?.displayName ?? "-",
    priority: issue.fields.priority?.name ?? "-",
    type: issue.fields.issuetype.name,
    labels: issue.fields.labels ?? [],
    created: issue.fields.created,
    updated: issue.fields.updated,
  }));
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

export const listCommand = new Command("list")
  .alias("ls")
  .description("List issues")
  .option("-a, --assignee <user>", "Filter by assignee (use 'x' for unassigned)")
  .option("-r, --reporter <user>", "Filter by reporter")
  .option("-s, --status <status>", "Filter by status (prefix with ~ to exclude)")
  .option("-t, --type <type>", "Filter by issue type")
  .option("-y, --priority <priority>", "Filter by priority")
  .option(
    "-l, --label <label>",
    "Filter by label (repeatable)",
    (val, prev: string[]) => prev.concat(val),
    []
  )
  .option("-C, --component <component>", "Filter by component")
  .option("-q, --jql <query>", "Raw JQL query")
  .option("-w, --watching", "Issues I'm watching")
  .option("--created <period>", "Created time filter (e.g., -7d, week, month)")
  .option("--updated <period>", "Updated time filter")
  .option("--order-by <field>", "Sort field", "created")
  .option("--reverse", "Reverse sort order (ASC)")
  .option("--limit <n>", "Maximum results", "50")
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

      if (opts["assignee"]) {
        builder.assignee(opts["assignee"] as string);
      }

      if (opts["reporter"]) {
        builder.reporter(opts["reporter"] as string);
      }

      if (opts["status"]) {
        builder.status(opts["status"] as string);
      }

      if (opts["type"]) {
        builder.type(opts["type"] as string);
      }

      if (opts["priority"]) {
        builder.priority(opts["priority"] as string);
      }

      if (opts["label"] && (opts["label"] as string[]).length > 0) {
        builder.labels(opts["label"] as string[]);
      }

      if (opts["component"]) {
        builder.component(opts["component"] as string);
      }

      if (opts["watching"]) {
        builder.watcher("currentUser()");
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
    });

    const formatted = formatIssuesForOutput(result.issues);

    if (format === "table") {
      const columns = opts["columns"]
        ? ISSUE_COLUMNS.filter((c) => (opts["columns"] as string).split(",").includes(c.key))
        : ISSUE_COLUMNS;

      const tableFormatter = new TableFormatter(columns);
      const outputStr = tableFormatter.format(
        { data: formatted, meta: { total: result.total, maxResults: result.maxResults } },
        { colors: globalOpts["color"] !== false }
      );
      console.log(outputStr);

      if (result.total && result.total > result.maxResults) {
        console.log(chalk.dim(`\nShowing ${result.issues.length} of ${result.total} issues`));
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
