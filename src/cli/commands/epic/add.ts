import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";

interface AddResult {
  epicKey: string;
  results: Array<{
    issueKey: string;
    success: boolean;
    error: string | null;
  }>;
}

function formatAddResult(result: AddResult, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    const successCount = result.results.filter((r) => r.success).length;
    const failureCount = result.results.filter((r) => !r.success).length;

    let message = "";

    if (successCount > 0) {
      const statusIcon = chalk.green("✓");
      if (successCount === 1 && result.results.length === 1) {
        message += `${statusIcon} Issue ${result.results[0]?.issueKey} has been added to epic ${result.epicKey}\n`;
      } else {
        message += `${statusIcon} ${successCount} issue${successCount > 1 ? "s" : ""} ${successCount > 1 ? "have" : "has"} been added to epic ${result.epicKey}\n`;
      }
    }

    if (failureCount > 0) {
      message += chalk.red(`\n✗ ${failureCount} issue${failureCount > 1 ? "s" : ""} failed:\n`);
      for (const res of result.results) {
        if (!res.success) {
          message += chalk.dim(`  ${res.issueKey}: ${res.error}\n`);
        }
      }
    }

    return message.trim();
  }
  return "";
}

export const addCommand = new Command("add")
  .description("Add issues to an epic")
  .argument("<epic-key>", "Epic key (e.g., PROJ-100)")
  .argument("<issue-keys...>", "Issue keys to add to the epic (e.g., PROJ-123 PROJ-124)")
  .action(async function (this: Command, epicKey: string, issueKeys: string[]) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      const results: Array<{
        issueKey: string;
        success: boolean;
        error: string | null;
      }> = [];

      for (const issueKey of issueKeys) {
        try {
          await issueEndpoint.update(issueKey, { parent: { key: epicKey } });
          results.push({
            issueKey,
            success: true,
            error: null,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          results.push({
            issueKey,
            success: false,
            error: errorMessage,
          });
        }
      }

      const result: AddResult = {
        epicKey,
        results,
      };

      if (format === "table" || format === "plain") {
        console.log(formatAddResult(result, format));
      } else {
        output(result, format);
      }

      const hasFailures = results.some((r) => !r.success);
      if (hasFailures) {
        process.exit(1);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      process.exit(1);
    }
  });
