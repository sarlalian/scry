import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { IssueLink } from "../../../api/types/issue.ts";
import { success, error, dryRun } from "../../../utils/messages.ts";
import { requireValidIssueKey } from "../../../utils/validation.ts";

interface UnlinkResult {
  success: boolean;
  sourceKey: string;
  targetKey: string;
  message: string;
}

function findLinks(targetKey: string, issueLinks: IssueLink[]): IssueLink[] {
  return issueLinks.filter(
    (link) => link.outwardIssue?.key === targetKey || link.inwardIssue?.key === targetKey
  );
}

function formatLinkDisplay(link: IssueLink, sourceKey: string): string {
  if (link.outwardIssue) {
    return `${sourceKey} ${link.type.outward} ${link.outwardIssue.key}`;
  } else if (link.inwardIssue) {
    return `${sourceKey} ${link.type.inward} ${link.inwardIssue.key}`;
  }
  return "Unknown link";
}

function formatUnlinkResult(result: UnlinkResult, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    let message = "";
    if (result.success) {
      message = success(result.message) + "\n";
    } else {
      message = error(result.message) + "\n";
    }
    message += chalk.dim(`Source: ${result.sourceKey}\n`);
    message += chalk.dim(`Target: ${result.targetKey}`);
    return message;
  }
  return "";
}

export const unlinkCommand = new Command("unlink")
  .description("Remove a link between two issues")
  .argument("<source-key>", "Source issue key (e.g., PROJ-123)")
  .argument("<target-key>", "Target issue key (e.g., PROJ-456)")
  .option("--dry-run", "Preview what would be unlinked without making changes")
  .action(async function (this: Command, sourceKey: string, targetKey: string) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";
    const opts = this.opts();
    const isDryRun = opts["dryRun"] as boolean | undefined;

    try {
      requireValidIssueKey(sourceKey);
      requireValidIssueKey(targetKey);

      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      const links = await issueEndpoint.getLinks(sourceKey);

      const matchingLinks = findLinks(targetKey, links);

      if (matchingLinks.length === 0) {
        throw new Error(`No link found between ${sourceKey} and ${targetKey}`);
      }

      if (matchingLinks.length > 1) {
        if (format === "table" || format === "plain") {
          console.log(
            chalk.yellow(`Multiple links found between ${sourceKey} and ${targetKey}:\n`)
          );
          for (const link of matchingLinks) {
            console.log(chalk.cyan(`  [${link.id}] ${formatLinkDisplay(link, sourceKey)}`));
          }
          console.log(
            chalk.yellow("\nPlease remove links individually using the Jira web interface or API.")
          );
        } else {
          output({ links: matchingLinks }, format);
        }
        return;
      }

      const linkToRemove = matchingLinks[0];
      if (!linkToRemove) {
        throw new Error("Unexpected error: link not found");
      }

      if (isDryRun) {
        if (format === "table" || format === "plain") {
          console.log("");
          console.log(
            dryRun(
              `Would remove link between ${chalk.bold(sourceKey)} and ${chalk.bold(targetKey)}`
            )
          );
          console.log(chalk.dim(`  Link: ${formatLinkDisplay(linkToRemove, sourceKey)}`));
          console.log("");
        } else {
          output(
            {
              dryRun: true,
              action: "unlink",
              sourceKey,
              targetKey,
              linkId: linkToRemove.id,
            },
            format
          );
        }
        return;
      }

      await issueEndpoint.unlink(linkToRemove.id);

      const result: UnlinkResult = {
        success: true,
        sourceKey,
        targetKey,
        message: `Successfully removed link between ${sourceKey} and ${targetKey}`,
      };

      if (format === "table" || format === "plain") {
        console.log(formatUnlinkResult(result, format));
      } else {
        output(result, format);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
