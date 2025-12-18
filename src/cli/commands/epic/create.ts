import { Command } from "commander";
import { input, editor } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { CreateIssueRequest, CreatedIssue } from "../../../api/types/issue.ts";
import { textToAdf, parseLabels } from "../../../utils/adf-helpers.ts";
import { success } from "../../../utils/messages.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

function formatCreatedEpic(epic: CreatedIssue, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    return (
      success("Epic created successfully!") +
      "\n" +
      chalk.cyan(`Key: ${epic.key}\n`) +
      chalk.dim(`ID: ${epic.id}\n`) +
      chalk.dim(`URL: ${epic.self}`)
    );
  }
  return "";
}

export const createCommand = new Command("create")
  .alias("new")
  .description("Create a new Jira epic")
  .option("-p, --project <key>", "Project key")
  .option("-s, --summary <text>", "Epic name/summary")
  .option("-d, --description <text>", "Epic description")
  .option("-a, --assignee <accountId>", "Assignee account ID")
  .option("-y, --priority <priority>", "Priority (e.g., High, Medium, Low)")
  .option("-l, --labels <labels>", "Comma-separated labels")
  .option("-i, --interactive", "Force interactive mode even if all flags provided");

addGlobalOptionsHelp(createCommand);

createCommand.action(async function (this: Command, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";
    const projectKeyGlobal = globalOpts["project"] as string | undefined;

    try {
      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      let projectKey = opts["project"] as string | undefined;
      let summary = opts["summary"] as string | undefined;
      let description = opts["description"] as string | undefined;
      let assignee = opts["assignee"] as string | undefined;
      let priority = opts["priority"] as string | undefined;
      let labels = opts["labels"] as string | undefined;

      const needsInteractive = opts["interactive"] || !projectKey || !summary;

      if (needsInteractive) {
        if (format === "table" || format === "plain") {
          console.log(chalk.cyan("\nCreate a new Jira epic\n"));
        }

        if (!projectKey) {
          projectKey = await input({
            message: "Project key:",
            default: projectKeyGlobal ?? config.project?.key ?? "",
            validate: (value) => {
              if (!value.trim()) {
                return "Project key is required";
              }
              return true;
            },
          });
        }

        if (!summary) {
          summary = await input({
            message: "Epic name:",
            validate: (value) => {
              if (!value.trim()) {
                return "Epic name is required";
              }
              return true;
            },
          });
        }

        if (!description) {
          const shouldAddDescription = await input({
            message: "Description (press Enter to skip, or type text):",
          });

          if (shouldAddDescription.trim()) {
            description = shouldAddDescription;
          } else {
            const useEditor = await input({
              message: "Open editor for longer description? (y/N):",
            });

            if (useEditor.toLowerCase() === "y" || useEditor.toLowerCase() === "yes") {
              description = await editor({
                message: "Enter epic description:",
              });
            }
          }
        }

        if (!priority) {
          const shouldAddPriority = await input({
            message: "Priority (press Enter to skip, or enter priority name):",
          });

          if (shouldAddPriority.trim()) {
            priority = shouldAddPriority;
          }
        }

        if (!assignee) {
          const shouldAddAssignee = await input({
            message: "Assignee account ID (press Enter to skip):",
          });

          if (shouldAddAssignee.trim()) {
            assignee = shouldAddAssignee;
          }
        }

        if (!labels) {
          const shouldAddLabels = await input({
            message: "Labels (comma-separated, press Enter to skip):",
          });

          if (shouldAddLabels.trim()) {
            labels = shouldAddLabels;
          }
        }
      } else {
        projectKey = projectKey || projectKeyGlobal || config.project?.key;
        if (!projectKey) {
          throw new Error("Project key is required. Use --project flag or set default project.");
        }
      }

      if (!projectKey || !summary) {
        throw new Error("Missing required fields: project and summary are required");
      }

      const fields: CreateIssueRequest = {
        project: { key: projectKey },
        issuetype: { name: "Epic" },
        summary,
      };

      if (description && description.trim()) {
        fields.description = textToAdf(description);
      }

      if (assignee) {
        fields.assignee = { accountId: assignee };
      }

      if (priority) {
        fields.priority = { name: priority };
      }

      if (labels) {
        fields.labels = parseLabels(labels);
      }

      if (globalOpts["debug"]) {
        console.log(chalk.dim("\nCreating epic with fields:"));
        console.log(chalk.dim(JSON.stringify(fields, null, 2)));
        console.log("");
      }

      const createdEpic = await issueEndpoint.create(fields);

      if (format === "table" || format === "plain") {
        console.log(formatCreatedEpic(createdEpic, format));
      } else {
        output(createdEpic, format);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
