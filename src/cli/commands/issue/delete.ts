import { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import { success, error, warning, dryRun } from "../../../utils/messages.ts";
import { parseIssueKeys, requireValidIssueKeys } from "../../../utils/validation.ts";

interface DeleteResult {
  success: boolean;
  issueKey: string;
  message: string;
  error?: string;
}

interface DeleteSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: DeleteResult[];
}

function createDeleteResult(issueKey: string, success: boolean, error?: string): DeleteResult {
  return {
    success,
    issueKey,
    message: success
      ? `Issue ${issueKey} deleted successfully`
      : `Failed to delete issue ${issueKey}`,
    error,
  };
}

function formatDeleteSummary(summary: DeleteSummary, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    let message = "";

    if (summary.total === 1) {
      const result = summary.results[0];
      if (!result) return "";

      if (result.success) {
        message += success(result.message) + "\n";
      } else {
        message += error(result.message) + "\n";
      }
      message += chalk.dim(`Issue: ${result.issueKey}`);

      if (result.error) {
        message += `\n${chalk.red(`Error: ${result.error}`)}`;
      }
    } else {
      message += chalk.bold(`\nDelete Summary:\n`);
      message += chalk.dim(`Total: ${summary.total}\n`);
      message += chalk.green(`Succeeded: ${summary.succeeded}\n`);
      message += chalk.red(`Failed: ${summary.failed}\n\n`);

      message += chalk.bold("Results:\n");
      for (const result of summary.results) {
        if (result.success) {
          message += `  ${success(result.issueKey)}`;
        } else {
          message += `  ${error(result.issueKey)}`;
        }

        if (result.error) {
          message += ` - ${chalk.red(result.error)}`;
        }

        message += "\n";
      }
    }

    return message;
  }
  return "";
}

export const deleteCommand = new Command("delete")
  .alias("rm")
  .description("Delete one or more Jira issues")
  .argument("<issue-keys...>", "Issue keys to delete (e.g., PROJ-123 PROJ-124)")
  .option("-f, --force", "Skip confirmation prompt")
  .option("-s, --delete-subtasks", "Delete subtasks along with the issue")
  .option("--dry-run", "Preview what would be deleted without making changes")
  .action(async function (this: Command, issueKeysInput: string[], opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";
    const force = opts["force"] as boolean | undefined;
    const deleteSubtasks = opts["deleteSubtasks"] as boolean | undefined;
    const isDryRun = opts["dryRun"] as boolean | undefined;

    try {
      if (!issueKeysInput || issueKeysInput.length === 0) {
        throw new Error("At least one issue key is required");
      }

      const issueKeys = issueKeysInput.flatMap(parseIssueKeys);

      if (issueKeys.length === 0) {
        throw new Error("No valid issue keys provided");
      }

      requireValidIssueKeys(issueKeys);

      if (isDryRun) {
        if (format === "table" || format === "plain") {
          console.log("");
          if (issueKeys.length === 1) {
            console.log(dryRun(`Would delete issue ${chalk.bold(issueKeys[0])}`));
          } else {
            console.log(dryRun(`Would delete ${chalk.bold(issueKeys.length.toString())} issues:`));
            issueKeys.forEach((key) => console.log(chalk.dim(`  - ${key}`)));
          }

          if (deleteSubtasks) {
            console.log(
              chalk.magenta.dim("  Subtasks would also be deleted with their parent issues.")
            );
          }
          console.log("");
        } else {
          const dryRunResults = issueKeys.map((key) => ({
            issueKey: key,
            action: "delete",
            deleteSubtasks: deleteSubtasks ?? false,
            dryRun: true,
          }));
          output({ dryRun: true, actions: dryRunResults }, format);
        }
        return;
      }

      if (!force) {
        if (format === "table" || format === "plain") {
          console.log("\n" + warning("This action cannot be undone!") + "\n");

          if (issueKeys.length === 1) {
            console.log(chalk.dim(`You are about to delete issue: ${chalk.bold(issueKeys[0])}`));
          } else {
            console.log(
              chalk.dim(
                `You are about to delete ${chalk.bold(issueKeys.length.toString())} issues:`
              )
            );
            issueKeys.forEach((key) => console.log(chalk.dim(`  - ${key}`)));
          }

          if (deleteSubtasks) {
            console.log(
              chalk.yellow.dim("\nSubtasks will also be deleted with their parent issues.")
            );
          }

          console.log("");
        }

        const confirmed = await confirm({
          message: `Are you sure you want to delete ${issueKeys.length === 1 ? "this issue" : "these issues"}?`,
          default: false,
        });

        if (!confirmed) {
          if (format === "table" || format === "plain") {
            console.log(chalk.dim("Deletion cancelled."));
          }
          process.exit(0);
        }
      }

      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      const results: DeleteResult[] = [];

      for (const issueKey of issueKeys) {
        try {
          await issueEndpoint.delete(issueKey, deleteSubtasks ?? false);
          results.push(createDeleteResult(issueKey, true));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          results.push(createDeleteResult(issueKey, false, errorMessage));
        }
      }

      const summary: DeleteSummary = {
        total: results.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };

      if (format === "table" || format === "plain") {
        console.log(formatDeleteSummary(summary, format));
      } else {
        output(summary, format);
      }

      if (summary.failed > 0) {
        throw new Error(`Failed to delete ${summary.failed} issue(s)`);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
