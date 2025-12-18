import { Command } from "commander";
import { input, select, editor } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { CreateIssueRequest, CreatedIssue } from "../../../api/types/issue.ts";
import { textToAdf, parseLabels, parseComponents } from "../../../utils/adf-helpers.ts";
import { success } from "../../../utils/messages.ts";

function formatCreatedIssue(issue: CreatedIssue, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    return (
      success("Issue created successfully!") +
      "\n" +
      chalk.cyan(`Key: ${issue.key}\n`) +
      chalk.dim(`ID: ${issue.id}\n`) +
      chalk.dim(`URL: ${issue.self}`)
    );
  }
  return "";
}

export const createCommand = new Command("create")
  .alias("new")
  .description("Create a new Jira issue")
  .option("-t, --type <type>", "Issue type (e.g., Task, Bug, Story)")
  .option("-s, --summary <text>", "Issue summary")
  .option("-d, --description <text>", "Issue description")
  .option("-a, --assignee <accountId>", "Assignee account ID")
  .option("-y, --priority <priority>", "Priority (e.g., High, Medium, Low)")
  .option("-l, --labels <labels>", "Comma-separated labels")
  .option("-C, --components <components>", "Comma-separated component names")
  .option("-P, --parent <key>", "Parent issue key (for subtasks)")
  .option("-i, --interactive", "Force interactive mode even if all flags provided")
  .action(async function (this: Command, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";
    const projectKeyGlobal = globalOpts["project"] as string | undefined;

    try {
      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      let projectKey = projectKeyGlobal ?? config.project?.key;
      let issueType = opts["type"] as string | undefined;
      let summary = opts["summary"] as string | undefined;
      let description = opts["description"] as string | undefined;
      let assignee = opts["assignee"] as string | undefined;
      let priority = opts["priority"] as string | undefined;
      let labels = opts["labels"] as string | undefined;
      let components = opts["components"] as string | undefined;
      let parentKey = opts["parent"] as string | undefined;

      const needsInteractive = opts["interactive"] || !projectKey || !issueType || !summary;

      if (needsInteractive) {
        if (format === "table" || format === "plain") {
          console.log(chalk.cyan("\nCreate a new Jira issue\n"));
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

        if (!issueType) {
          issueType = await select({
            message: "Issue type:",
            choices: [
              { value: "Task", name: "Task" },
              { value: "Bug", name: "Bug" },
              { value: "Story", name: "Story" },
              { value: "Epic", name: "Epic" },
              { value: "Subtask", name: "Subtask" },
            ],
            default: "Task",
          });
        }

        if (!summary) {
          summary = await input({
            message: "Summary:",
            validate: (value) => {
              if (!value.trim()) {
                return "Summary is required";
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
                message: "Enter issue description:",
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

        if (!components) {
          const shouldAddComponents = await input({
            message: "Components (comma-separated, press Enter to skip):",
          });

          if (shouldAddComponents.trim()) {
            components = shouldAddComponents;
          }
        }

        if (!parentKey && issueType === "Subtask") {
          parentKey = await input({
            message: "Parent issue key (required for subtasks):",
            validate: (value) => {
              if (!value.trim()) {
                return "Parent issue key is required for subtasks";
              }
              return true;
            },
          });
        }
      }

      if (!projectKey || !issueType || !summary) {
        throw new Error("Missing required fields: project, type, and summary are required");
      }

      const fields: CreateIssueRequest = {
        project: { key: projectKey },
        issuetype: { name: issueType },
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

      if (components) {
        fields.components = parseComponents(components);
      }

      if (parentKey) {
        fields.parent = { key: parentKey };
      }

      if (globalOpts["debug"]) {
        console.log(chalk.dim("\nCreating issue with fields:"));
        console.log(chalk.dim(JSON.stringify(fields, null, 2)));
        console.log("");
      }

      const createdIssue = await issueEndpoint.create(fields);

      if (format === "table" || format === "plain") {
        console.log(formatCreatedIssue(createdIssue, format));
      } else {
        output(createdIssue, format);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
