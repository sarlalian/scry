import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { Issue, Comment } from "../../../api/types/issue.ts";
import type {
  AtlassianDocument,
  AtlassianNode,
  InlineNode,
  TextNode,
} from "../../../api/types/common.ts";
import { requireValidIssueKey } from "../../../utils/validation.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

interface BriefIssue {
  key: string;
  summary: string;
  description: string | null;
  status: string;
  type: string;
  priority: string | null;
  assignee: { name: string; accountId: string } | null;
  reporter: { name: string; accountId: string } | null;
  project: { key: string; name: string };
  labels: string[];
  components: string[];
  fixVersions: string[];
  parent: string | null;
  created: string;
  updated: string;
  comments?: Array<{
    author: string;
    created: string;
    body: string;
  }>;
}

function adfToPlainText(doc: AtlassianDocument | null | undefined): string {
  if (!doc || !doc.content) return "";

  function processNodes(nodes: AtlassianNode[]): string {
    return nodes
      .map((node) => {
        switch (node.type) {
          case "paragraph":
            return processInlineNodes(node.content ?? []) + "\n";
          case "heading": {
            const level = node.attrs.level;
            const prefix = "#".repeat(level) + " ";
            return prefix + processInlineNodes(node.content ?? []) + "\n";
          }
          case "bulletList":
            return node.content.map((li) => "• " + processNodes(li.content)).join("");
          case "orderedList":
            return node.content.map((li, i) => `${i + 1}. ` + processNodes(li.content)).join("");
          case "codeBlock": {
            const code = node.content?.map((t) => t.text).join("") ?? "";
            return "```\n" + code + "\n```\n";
          }
          case "blockquote":
            return (
              processNodes(node.content)
                .split("\n")
                .map((l) => "> " + l)
                .join("\n") + "\n"
            );
          case "rule":
            return "---\n";
          default:
            return "";
        }
      })
      .join("");
  }

  function processInlineNodes(nodes: InlineNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === "text") {
          return (node as TextNode).text;
        }
        if (node.type === "hardBreak") {
          return "\n";
        }
        if (node.type === "mention") {
          return `@${node.attrs.text ?? node.attrs.id}`;
        }
        if (node.type === "emoji") {
          return node.attrs.text ?? node.attrs.shortName;
        }
        return "";
      })
      .join("");
  }

  return processNodes(doc.content).trim();
}

function formatIssueDetails(issue: Issue): string {
  const lines: string[] = [];
  const f = issue.fields;

  lines.push(chalk.cyan.bold(`${issue.key}: ${f.summary}`));
  lines.push("");

  const statusColor =
    f.status.statusCategory.key === "done"
      ? chalk.green
      : f.status.statusCategory.key === "indeterminate"
        ? chalk.blue
        : chalk.gray;

  lines.push(`${chalk.dim("Status:")}     ${statusColor(f.status.name)}`);
  lines.push(`${chalk.dim("Type:")}       ${f.issuetype.name}`);
  lines.push(`${chalk.dim("Priority:")}   ${f.priority?.name ?? "-"}`);
  lines.push(`${chalk.dim("Assignee:")}   ${f.assignee?.displayName ?? "Unassigned"}`);
  lines.push(`${chalk.dim("Reporter:")}   ${f.reporter?.displayName ?? "-"}`);
  lines.push(`${chalk.dim("Project:")}    ${f.project.name} (${f.project.key})`);

  if (f.labels && f.labels.length > 0) {
    lines.push(`${chalk.dim("Labels:")}     ${f.labels.join(", ")}`);
  }

  if (f.components && f.components.length > 0) {
    lines.push(`${chalk.dim("Components:")} ${f.components.map((c) => c.name).join(", ")}`);
  }

  if (f.fixVersions && f.fixVersions.length > 0) {
    lines.push(`${chalk.dim("Fix Version:")} ${f.fixVersions.map((v) => v.name).join(", ")}`);
  }

  if (f.parent) {
    lines.push(`${chalk.dim("Parent:")}     ${f.parent.key}`);
  }

  lines.push(`${chalk.dim("Created:")}    ${new Date(f.created).toLocaleString()}`);
  lines.push(`${chalk.dim("Updated:")}    ${new Date(f.updated).toLocaleString()}`);

  if (f.description) {
    lines.push("");
    lines.push(chalk.dim("Description:"));
    lines.push(adfToPlainText(f.description));
  }

  return lines.join("\n");
}

function toBriefIssue(issue: Issue, commentCount: number): BriefIssue {
  const f = issue.fields;

  const brief: BriefIssue = {
    key: issue.key,
    summary: f.summary,
    description: f.description ? adfToPlainText(f.description) : null,
    status: f.status.name,
    type: f.issuetype.name,
    priority: f.priority?.name ?? null,
    assignee: f.assignee
      ? { name: f.assignee.displayName, accountId: f.assignee.accountId }
      : null,
    reporter: f.reporter
      ? { name: f.reporter.displayName, accountId: f.reporter.accountId }
      : null,
    project: { key: f.project.key, name: f.project.name },
    labels: f.labels ?? [],
    components: f.components?.map((c) => c.name) ?? [],
    fixVersions: f.fixVersions?.map((v) => v.name) ?? [],
    parent: f.parent?.key ?? null,
    created: f.created,
    updated: f.updated,
  };

  if (commentCount > 0 && f.comment?.comments) {
    brief.comments = f.comment.comments.slice(-commentCount).map((c: Comment) => ({
      author: c.author.displayName,
      created: c.created,
      body: adfToPlainText(c.body),
    }));
  }

  return brief;
}

export const viewCommand = new Command("view")
  .alias("show")
  .description("View issue details")
  .argument("<issue-key>", "Issue key (e.g., PROJ-123)")
  .option("--comments <n>", "Show n recent comments", "0")
  .option("-b, --brief", "Output simplified data for AI agents (JSON/XML only)");

addGlobalOptionsHelp(viewCommand);

viewCommand.action(async function (this: Command, issueKey: string, opts) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";
    const isBrief = opts["brief"] as boolean | undefined;

    try {
      requireValidIssueKey(issueKey);

      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      const expand: string[] = [];
      const commentCount = parseInt(opts["comments"] as string, 10);
      if (commentCount > 0) {
        expand.push("renderedFields");
      }

      const issue = await issueEndpoint.get(issueKey, {
        fields: [
          "summary",
          "description",
          "status",
          "assignee",
          "reporter",
          "priority",
          "issuetype",
          "project",
          "labels",
          "components",
          "fixVersions",
          "created",
          "updated",
          "parent",
          "comment",
        ],
        expand,
      });

      if (format === "table" || format === "plain") {
        console.log(formatIssueDetails(issue));

        if (commentCount > 0 && issue.fields.comment) {
          const comments = issue.fields.comment.comments.slice(-commentCount);
          if (comments.length > 0) {
            console.log("\n" + chalk.dim("Recent Comments:"));
            for (const comment of comments) {
              console.log(
                chalk.cyan(`\n${comment.author.displayName}`) +
                  chalk.dim(` (${new Date(comment.created).toLocaleString()})`)
              );
              console.log(adfToPlainText(comment.body));
            }
          }
        }
      } else {
        if (isBrief) {
          output(toBriefIssue(issue, commentCount), format);
        } else {
          output(issue, format);
        }
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
