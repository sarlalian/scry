import { Command } from "commander";
import { input, editor } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { Comment } from "../../../api/types/issue.ts";

function formatComment(comment: Comment, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    return (
      chalk.green.bold("Comment added successfully!\n") +
      chalk.cyan(`ID: ${comment.id}\n`) +
      chalk.dim(`Author: ${comment.author.displayName}\n`) +
      chalk.dim(`Created: ${comment.created}`)
    );
  }
  return "";
}

export const commentCommand = new Command("comment")
  .description("Manage issue comments")
  .addCommand(
    new Command("add")
      .description("Add a comment to an issue")
      .argument("<issueKey>", "Issue key (e.g., PROJ-123)")
      .argument("[body]", "Comment body text")
      .option("-b, --body <text>", "Comment body (alternative to argument)")
      .option("-e, --editor", "Open editor for comment body")
      .action(async function (this: Command, issueKey: string, bodyArg: string | undefined, opts) {
        const parent = this.parent?.parent?.parent;
        const globalOpts = parent?.opts() ?? {};
        const format = (globalOpts["output"] as OutputFormat) ?? "table";

        try {
          const configManager = getConfigManager();
          const config = configManager.load(globalOpts["config"] as string | undefined);
          const client = new JiraClient(config);
          const issueEndpoint = new IssueEndpoint(client);

          let body = bodyArg;

          // Check for body from flag
          if (!body && opts["body"]) {
            body = opts["body"] as string;
          }

          // Check for editor flag
          if (!body && opts["editor"]) {
            body = await editor({
              message: "Enter comment body:",
            });
          }

          // Interactive prompt if no body provided
          if (!body) {
            const useEditor = await input({
              message: "Open editor for comment? (y/N):",
            });

            if (useEditor.toLowerCase() === "y" || useEditor.toLowerCase() === "yes") {
              body = await editor({
                message: "Enter comment body:",
              });
            } else {
              body = await input({
                message: "Comment body:",
                validate: (value) => {
                  if (!value.trim()) {
                    return "Comment body is required";
                  }
                  return true;
                },
              });
            }
          }

          if (!body || !body.trim()) {
            throw new Error("Comment body is required");
          }

          if (globalOpts["debug"]) {
            console.log(chalk.dim(`\nAdding comment to issue: ${issueKey}`));
            console.log(chalk.dim(`Comment body: ${body.substring(0, 50)}...`));
            console.log("");
          }

          const comment = await issueEndpoint.addComment(issueKey, body);

          if (format === "table" || format === "plain") {
            console.log(formatComment(comment, format));
          } else {
            output(comment, format);
          }
        } catch (err) {
          outputError(err instanceof Error ? err : String(err), format);
          process.exit(1);
        }
      })
  );
