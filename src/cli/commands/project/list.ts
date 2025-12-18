import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { ProjectEndpoint } from "../../../api/endpoints/project.ts";
import {
  output,
  outputError,
  TableFormatter,
  type OutputFormat,
  type TableColumn,
} from "../../../output/index.ts";
import type { Project } from "../../../api/types/project.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

const PROJECT_COLUMNS: TableColumn[] = [
  { key: "key", header: "Key", width: 10 },
  { key: "name", header: "Name", width: 35 },
  { key: "projectType", header: "Type", width: 15 },
  { key: "lead", header: "Lead", width: 25 },
];

function formatProjectType(typeKey: string): string {
  const typeMap: Record<string, string> = {
    software: "Software",
    business: "Business",
    service_desk: "Service Desk",
  };
  return typeMap[typeKey] ?? typeKey;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

function formatProjectsForOutput(projects: Project[]) {
  return projects.map((project) => ({
    key: project.key,
    name: truncate(project.name, 33),
    projectType: formatProjectType(project.projectTypeKey),
    lead: project.lead?.displayName ? truncate(project.lead.displayName, 23) : "-",
  }));
}

export const listCommand = new Command("list")
  .alias("ls")
  .description("List all Jira projects")
  .option("-n, --name <pattern>", "Filter projects by name pattern")
  .option("--order-by <field>", "Sort field (e.g., key, name)", "key")
  .option("--limit <n>", "Maximum results", "50")
  .option("--start-at <n>", "Start at result number", "0")
  .option("--columns <cols>", "Columns to display (comma-separated)");

addGlobalOptionsHelp(listCommand);

listCommand.action(async function (this: Command, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const projectEndpoint = new ProjectEndpoint(client);

      if (globalOpts["debug"]) {
        if (opts["name"]) {
          console.log(chalk.dim(`Name filter: ${opts["name"]}`));
        }
        console.log(chalk.dim(`Order by: ${opts["orderBy"]}\n`));
      }

      const result = await projectEndpoint.list({
        query: opts["name"] as string | undefined,
        orderBy: opts["orderBy"] as string,
        maxResults: parseInt(opts["limit"] as string, 10),
        startAt: parseInt(opts["startAt"] as string, 10),
      });

      const formatted = formatProjectsForOutput(result.values);

      if (format === "table") {
        const columns = opts["columns"]
          ? PROJECT_COLUMNS.filter((c) => (opts["columns"] as string).split(",").includes(c.key))
          : PROJECT_COLUMNS;

        const tableFormatter = new TableFormatter(columns);
        const outputStr = tableFormatter.format(
          {
            data: formatted,
            meta: {
              total: result.total,
              maxResults: result.maxResults,
              startAt: result.startAt,
            },
          },
          { colors: globalOpts["color"] !== false }
        );
        console.log(outputStr);

        if (result.total > result.maxResults) {
          console.log(chalk.dim(`\nShowing ${result.values.length} of ${result.total} projects`));
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
      throw err;
    }
  });
