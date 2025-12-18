import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { CreateIssueRequest, CreatedIssue } from "../../../api/types/issue.ts";
import { parseLabels, parseComponents } from "../../../utils/adf-helpers.ts";
import { requireValidIssueKey } from "../../../utils/validation.ts";
import { success } from "../../../utils/messages.ts";

function formatClonedIssue(issue: CreatedIssue, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    return (
      success("Issue cloned successfully!") +
      "\n" +
      chalk.cyan(`Key: ${issue.key}\n`) +
      chalk.dim(`ID: ${issue.id}\n`) +
      chalk.dim(`URL: ${issue.self}`)
    );
  }
  return "";
}

export const cloneCommand = new Command("clone")
  .alias("copy")
  .description("Clone an existing Jira issue")
  .argument("<issue-key>", "Source issue key to clone (e.g., PROJ-123)")
  .option("-p, --project <key>", "Target project key (defaults to source project)")
  .option("-s, --summary <text>", "Override summary (defaults to 'Clone of [original]')")
  .option("-l, --labels <labels>", "Additional comma-separated labels to add")
  .option("-C, --components <components>", "Override components (comma-separated names)")
  .option("-y, --priority <priority>", "Override priority (e.g., High, Medium, Low)")
  .option("--no-description", "Do not copy description from source issue")
  .option("--link", "Create 'Cloners' link between source and cloned issue")
  .action(async function (this: Command, issueKey: string, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      requireValidIssueKey(issueKey);

      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      if (format === "table" || format === "plain") {
        console.log(chalk.cyan(`\nCloning issue ${issueKey}...\n`));
      }

      const originalIssue = await issueEndpoint.get(issueKey, {
        fields: [
          "summary",
          "description",
          "issuetype",
          "project",
          "labels",
          "components",
          "priority",
        ],
      });

      const targetProject = opts["project"] as string | undefined;
      const customSummary = opts["summary"] as string | undefined;
      const additionalLabels = opts["labels"] as string | undefined;
      const overrideComponents = opts["components"] as string | undefined;
      const overridePriority = opts["priority"] as string | undefined;
      const copyDescription = opts["description"] !== false;
      const createLink = opts["link"] === true;

      const cloneFields: CreateIssueRequest = {
        project: { key: targetProject || originalIssue.fields.project.key },
        issuetype: { name: originalIssue.fields.issuetype.name },
        summary: customSummary || `Clone of ${originalIssue.fields.summary}`,
      };

      if (copyDescription && originalIssue.fields.description) {
        cloneFields.description = originalIssue.fields.description;
      }

      if (overrideComponents) {
        cloneFields.components = parseComponents(overrideComponents);
      } else if (originalIssue.fields.components && originalIssue.fields.components.length > 0) {
        cloneFields.components = originalIssue.fields.components.map((c) => ({ id: c.id }));
      }

      if (overridePriority) {
        cloneFields.priority = { name: overridePriority };
      } else if (originalIssue.fields.priority) {
        cloneFields.priority = { id: originalIssue.fields.priority.id };
      }

      const originalLabels = originalIssue.fields.labels || [];
      const parsedAdditionalLabels = parseLabels(additionalLabels) || [];
      const combinedLabels = [...originalLabels, ...parsedAdditionalLabels];
      if (combinedLabels.length > 0) {
        cloneFields.labels = combinedLabels;
      }

      if (globalOpts["debug"]) {
        console.log(chalk.dim("\nCloning issue with fields:"));
        console.log(chalk.dim(JSON.stringify(cloneFields, null, 2)));
        console.log("");
      }

      const clonedIssue = await issueEndpoint.create(cloneFields);

      if (createLink) {
        try {
          await issueEndpoint.link(issueKey, clonedIssue.key, "Cloners");
          if (format === "table" || format === "plain") {
            console.log(chalk.dim(`Created link: ${issueKey} clones ${clonedIssue.key}\n`));
          }
        } catch (linkError) {
          if (format === "table" || format === "plain") {
            console.log(
              chalk.yellow(
                `Warning: Failed to create issue link: ${linkError instanceof Error ? linkError.message : String(linkError)}\n`
              )
            );
          }
        }
      }

      if (format === "table" || format === "plain") {
        console.log(formatClonedIssue(clonedIssue, format));
      } else {
        output(clonedIssue, format);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
