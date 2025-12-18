import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import { success, error } from "../../../utils/messages.ts";
import { requireValidIssueKey, requireValidIssueKeys } from "../../../utils/validation.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

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
      if (successCount === 1 && result.results.length === 1) {
        message +=
          success(`Issue ${result.results[0]?.issueKey} has been added to epic ${result.epicKey}`) +
          "\n";
      } else {
        message +=
          success(
            `${successCount} issue${successCount > 1 ? "s" : ""} ${successCount > 1 ? "have" : "has"} been added to epic ${result.epicKey}`
          ) + "\n";
      }
    }

    if (failureCount > 0) {
      message += "\n" + error(`${failureCount} issue${failureCount > 1 ? "s" : ""} failed:`) + "\n";
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
  .argument("<issue-keys...>", "Issue keys to add to the epic (e.g., PROJ-123 PROJ-124)");

addGlobalOptionsHelp(addCommand);

addCommand.action(async function (this: Command, epicKey: string, issueKeys: string[]) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      requireValidIssueKey(epicKey);
      requireValidIssueKeys(issueKeys);

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
        throw new Error("Failed to add one or more issues to epic");
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
