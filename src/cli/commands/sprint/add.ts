import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { SprintEndpoint } from "../../../api/endpoints/sprint.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import { success } from "../../../utils/messages.ts";
import { requireValidIssueKeys } from "../../../utils/validation.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

function formatSuccessMessage(sprintId: number, issueKeys: string[]): string {
  const issueCount = issueKeys.length;
  const issueText = issueCount === 1 ? "issue" : "issues";
  const issueList = issueKeys.join(", ");
  return (
    success(`Successfully added ${issueCount} ${issueText} to sprint ${sprintId}`) +
    "\n" +
    chalk.dim(`Issues: ${issueList}`)
  );
}

export const addCommand = new Command("add")
  .description("Add issues to a sprint")
  .argument("<sprint-id>", "Sprint ID")
  .argument("<issue-keys...>", "Issue keys to add (e.g., SCRY-123 SCRY-456)");

addGlobalOptionsHelp(addCommand);

addCommand.action(async function (this: Command, sprintIdStr: string, issueKeys: string[]) {
  const parent = this.parent?.parent;
  const globalOpts = parent?.opts() ?? {};
  const format = (globalOpts["output"] as OutputFormat) ?? "table";

  try {
    const sprintId = parseInt(sprintIdStr, 10);
    if (isNaN(sprintId)) {
      throw new Error("Sprint ID must be a number");
    }

    if (issueKeys.length === 0) {
      throw new Error("At least one issue key is required");
    }

    requireValidIssueKeys(issueKeys);

    const configManager = getConfigManager();
    const config = configManager.load(globalOpts["config"] as string | undefined);
    const client = new JiraClient(config);
    const sprintEndpoint = new SprintEndpoint(client);

    if (globalOpts["debug"]) {
      console.log(chalk.dim(`Sprint ID: ${sprintId}`));
      console.log(chalk.dim(`Issue keys: ${issueKeys.join(", ")}\n`));
    }

    await sprintEndpoint.addIssues(sprintId, issueKeys);

    if (format === "table" || format === "plain") {
      console.log(formatSuccessMessage(sprintId, issueKeys));
    } else {
      output(
        {
          sprintId,
          issuesAdded: issueKeys.length,
          issueKeys,
        },
        format
      );
    }
  } catch (err) {
    outputError(err instanceof Error ? err : String(err), format);
    throw err;
  }
});
