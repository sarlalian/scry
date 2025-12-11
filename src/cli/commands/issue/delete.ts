import { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";

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

function parseIssueKeys(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function isValidIssueKey(key: string): boolean {
  return /^[A-Z]+-\d+$/.test(key);
}

function validateIssueKeys(keys: string[]): { valid: boolean; invalidKeys: string[] } {
  const invalidKeys = keys.filter((key) => !isValidIssueKey(key));
  return {
    valid: invalidKeys.length === 0,
    invalidKeys,
  };
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

      const statusIcon = result.success ? chalk.green("✓") : chalk.red("✗");
      message += `${statusIcon} ${result.message}\n`;
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
        const statusIcon = result.success ? chalk.green("✓") : chalk.red("✗");
        message += `  ${statusIcon} ${result.issueKey}`;

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
  .action(async function (this: Command, issueKeysInput: string[], opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";
    const force = opts["force"] as boolean | undefined;
    const deleteSubtasks = opts["deleteSubtasks"] as boolean | undefined;

    try {
      if (!issueKeysInput || issueKeysInput.length === 0) {
        throw new Error("At least one issue key is required");
      }

      const issueKeys = issueKeysInput.flatMap(parseIssueKeys);

      if (issueKeys.length === 0) {
        throw new Error("No valid issue keys provided");
      }

      const validation = validateIssueKeys(issueKeys);
      if (!validation.valid) {
        throw new Error(
          `Invalid issue key format: ${validation.invalidKeys.join(", ")}. ` +
            `Issue keys must be in the format: PROJECT-123`
        );
      }

      if (!force) {
        if (format === "table" || format === "plain") {
          console.log(chalk.yellow.bold("\nWarning: This action cannot be undone!\n"));

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
        process.exit(1);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      process.exit(1);
    }
  });
