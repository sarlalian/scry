import { Command } from "commander";
import { input, select, editor, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { CreateIssueRequest, Issue } from "../../../api/types/issue.ts";
import type { AtlassianDocument, InlineNode } from "../../../api/types/common.ts";
import { textToAdf, parseLabels, parseComponents } from "../../../utils/adf-helpers.ts";
import { requireValidIssueKey } from "../../../utils/validation.ts";
import { success, dryRun } from "../../../utils/messages.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

function adfToPlainText(doc: AtlassianDocument | null | undefined): string {
  if (!doc || !doc.content) return "";

  function processNodes(nodes: AtlassianDocument["content"]): string {
    return nodes
      .map((node) => {
        if (node.type === "paragraph") {
          return processInlineNodes(node.content ?? []) + "\n";
        }
        return "";
      })
      .join("");
  }

  function processInlineNodes(nodes: InlineNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === "text") {
          return node.text;
        }
        return "";
      })
      .join("");
  }

  return processNodes(doc.content).trim();
}

function formatUpdatedIssue(issue: Issue, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    return (
      success("Issue updated successfully!") +
      "\n" +
      chalk.cyan(`Key: ${issue.key}\n`) +
      chalk.dim(`Summary: ${issue.fields.summary}\n`) +
      chalk.dim(`Status: ${issue.fields.status.name}`)
    );
  }
  return "";
}

export const editCommand = new Command("edit")
  .alias("update")
  .description("Edit an existing Jira issue")
  .argument("<issue-key>", "Issue key (e.g., PROJ-123)")
  .option("-s, --summary <text>", "Update issue summary")
  .option("-d, --description <text>", "Update issue description")
  .option("-a, --assignee <accountId>", "Update assignee account ID")
  .option("-y, --priority <priority>", "Update priority (e.g., High, Medium, Low)")
  .option("-l, --labels <labels>", "Update labels (comma-separated)")
  .option("-C, --components <components>", "Update components (comma-separated)")
  .option("-i, --interactive", "Interactive mode with prompts showing current values")
  .option("--dry-run", "Preview what would be updated without making changes");

addGlobalOptionsHelp(editCommand);

editCommand.action(async function (this: Command, issueKey: string, opts) {
  const parent = this.parent?.parent;
  const globalOpts = parent?.opts() ?? {};
  const format = (globalOpts["output"] as OutputFormat) ?? "table";
  const isDryRun = opts["dryRun"] as boolean | undefined;

  try {
    requireValidIssueKey(issueKey);

    const configManager = getConfigManager();
    const config = configManager.load(globalOpts["config"] as string | undefined);
    const client = new JiraClient(config);
    const issueEndpoint = new IssueEndpoint(client);

    let summary = opts["summary"] as string | undefined;
    let description = opts["description"] as string | undefined;
    let assignee = opts["assignee"] as string | undefined;
    let priority = opts["priority"] as string | undefined;
    let labels = opts["labels"] as string | undefined;
    let components = opts["components"] as string | undefined;

    const needsInteractive =
      opts["interactive"] ||
      (!summary && !description && !assignee && !priority && !labels && !components);

    if (needsInteractive) {
      if (format === "table" || format === "plain") {
        console.log(chalk.cyan(`\nEdit issue ${chalk.bold(issueKey)}\n`));
        console.log(chalk.dim("Fetching current issue data...\n"));
      }

      const currentIssue = await issueEndpoint.get(issueKey, {
        fields: [
          "summary",
          "description",
          "assignee",
          "priority",
          "labels",
          "components",
          "status",
        ],
      });

      if (format === "table" || format === "plain") {
        console.log(chalk.dim("Current values:"));
        console.log(chalk.dim(`  Summary: ${currentIssue.fields.summary}`));
        console.log(chalk.dim(`  Priority: ${currentIssue.fields.priority?.name ?? "None"}`));
        console.log(
          chalk.dim(`  Assignee: ${currentIssue.fields.assignee?.displayName ?? "Unassigned"}`)
        );
        console.log(chalk.dim(`  Labels: ${currentIssue.fields.labels?.join(", ") ?? "None"}`));
        console.log(
          chalk.dim(
            `  Components: ${currentIssue.fields.components?.map((c) => c.name).join(", ") ?? "None"}`
          )
        );
        console.log("");
      }

      if (!summary) {
        const updateSummary = await confirm({
          message: "Update summary?",
          default: false,
        });

        if (updateSummary) {
          summary = await input({
            message: "New summary:",
            default: currentIssue.fields.summary,
            validate: (value) => {
              if (!value.trim()) {
                return "Summary cannot be empty";
              }
              return true;
            },
          });
        }
      }

      if (!description) {
        const updateDescription = await confirm({
          message: "Update description?",
          default: false,
        });

        if (updateDescription) {
          const currentDesc = adfToPlainText(currentIssue.fields.description);
          const useEditor = await confirm({
            message: "Use editor for description?",
            default: true,
          });

          if (useEditor) {
            description = await editor({
              message: "Enter issue description:",
              default: currentDesc,
            });
          } else {
            description = await input({
              message: "New description:",
              default: currentDesc,
            });
          }
        }
      }

      if (!priority) {
        const updatePriority = await confirm({
          message: "Update priority?",
          default: false,
        });

        if (updatePriority) {
          priority = await select({
            message: "Select priority:",
            choices: [
              { value: "Highest", name: "Highest" },
              { value: "High", name: "High" },
              { value: "Medium", name: "Medium" },
              { value: "Low", name: "Low" },
              { value: "Lowest", name: "Lowest" },
            ],
            default: currentIssue.fields.priority?.name ?? "Medium",
          });
        }
      }

      if (!assignee) {
        const updateAssignee = await confirm({
          message: "Update assignee?",
          default: false,
        });

        if (updateAssignee) {
          assignee = await input({
            message: "Assignee account ID (leave empty to unassign):",
            default: currentIssue.fields.assignee?.accountId ?? "",
          });
        }
      }

      if (!labels) {
        const updateLabels = await confirm({
          message: "Update labels?",
          default: false,
        });

        if (updateLabels) {
          labels = await input({
            message: "Labels (comma-separated):",
            default: currentIssue.fields.labels?.join(", ") ?? "",
          });
        }
      }

      if (!components) {
        const updateComponents = await confirm({
          message: "Update components?",
          default: false,
        });

        if (updateComponents) {
          components = await input({
            message: "Components (comma-separated):",
            default: currentIssue.fields.components?.map((c) => c.name).join(", ") ?? "",
          });
        }
      }
    }

    const fields: Partial<CreateIssueRequest> = {};

    if (summary && summary.trim()) {
      fields.summary = summary;
    }

    if (description !== undefined) {
      if (description.trim()) {
        fields.description = textToAdf(description);
      } else {
        fields.description = textToAdf("");
      }
    }

    if (assignee !== undefined) {
      if (assignee.trim()) {
        fields.assignee = { accountId: assignee };
      } else {
        fields.assignee = { accountId: "" };
      }
    }

    if (priority && priority.trim()) {
      fields.priority = { name: priority };
    }

    if (labels !== undefined) {
      const parsedLabels = parseLabels(labels);
      fields.labels = parsedLabels ?? [];
    }

    if (components !== undefined) {
      const parsedComponents = parseComponents(components);
      fields.components = parsedComponents ?? [];
    }

    if (Object.keys(fields).length === 0) {
      throw new Error("No fields to update. Provide at least one field to update.");
    }

    if (isDryRun) {
      if (format === "table" || format === "plain") {
        console.log("");
        console.log(
          dryRun(`Would update issue ${chalk.bold(issueKey)} with the following fields:`)
        );
        console.log("");

        if (fields.summary) {
          console.log(chalk.dim(`  Summary: ${fields.summary}`));
        }
        if (fields.description) {
          console.log(chalk.dim(`  Description: ${adfToPlainText(fields.description)}`));
        }
        if (fields.assignee) {
          console.log(chalk.dim(`  Assignee: ${fields.assignee.accountId || "Unassigned"}`));
        }
        if (fields.priority && "name" in fields.priority) {
          console.log(chalk.dim(`  Priority: ${fields.priority.name}`));
        }
        if (fields.labels) {
          console.log(chalk.dim(`  Labels: ${fields.labels.join(", ")}`));
        }
        if (fields.components) {
          console.log(
            chalk.dim(
              `  Components: ${fields.components.map((c) => ("name" in c ? c.name : c.id)).join(", ")}`
            )
          );
        }
        console.log("");
      } else {
        output({ dryRun: true, issueKey, action: "update", fields }, format);
      }
      return;
    }

    if (globalOpts["debug"]) {
      console.log(chalk.dim("\nUpdating issue with fields:"));
      console.log(chalk.dim(JSON.stringify(fields, null, 2)));
      console.log("");
    }

    await issueEndpoint.update(issueKey, fields);

    const updatedIssue = await issueEndpoint.get(issueKey, {
      fields: ["summary", "status", "assignee", "priority", "labels", "components"],
    });

    if (format === "table" || format === "plain") {
      console.log(formatUpdatedIssue(updatedIssue, format));
    } else {
      output(updatedIssue, format);
    }
  } catch (err) {
    outputError(err instanceof Error ? err : String(err), format);
    throw err;
  }
});
