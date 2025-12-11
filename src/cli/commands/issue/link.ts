import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { IssueLinkType } from "../../../api/types/issue.ts";

interface LinkResult {
  success: boolean;
  sourceKey: string;
  targetKey: string;
  linkType: string;
  message: string;
}

function isValidIssueKey(key: string): boolean {
  return /^[A-Z]+-\d+$/.test(key);
}

function findLinkType(search: string, types: IssueLinkType[]): IssueLinkType | undefined {
  const normalized = search.toLowerCase();
  return types.find(
    (t) =>
      t.name.toLowerCase() === normalized ||
      t.inward.toLowerCase() === normalized ||
      t.outward.toLowerCase() === normalized
  );
}

function formatLinkTypes(types: IssueLinkType[]): string {
  let message = chalk.bold("Available link types:\n\n");
  for (const type of types) {
    message += chalk.cyan(`  ${type.name}\n`);
    message += chalk.dim(`    ${type.outward} / ${type.inward}\n\n`);
  }
  return message;
}

function formatLinkResult(result: LinkResult, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    const statusIcon = result.success ? chalk.green("✓") : chalk.red("✗");
    let message = `${statusIcon} ${result.message}\n`;
    message += chalk.dim(`Source: ${result.sourceKey}\n`);
    message += chalk.dim(`Target: ${result.targetKey}\n`);
    message += chalk.dim(`Type: ${result.linkType}`);
    return message;
  }
  return "";
}

export const linkCommand = new Command("link")
  .description("Link two issues together")
  .argument("<source-key>", "Source issue key (e.g., PROJ-123)")
  .argument("<target-key>", "Target issue key (e.g., PROJ-456)")
  .option("-t, --type <link-type>", "Link type (e.g., Blocks, Relates, Duplicates)")
  .action(async function (this: Command, sourceKey: string, targetKey: string) {
    const opts = this.opts<{ type?: string }>();
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      if (!isValidIssueKey(sourceKey)) {
        throw new Error(`Invalid source issue key: ${sourceKey}`);
      }

      if (!isValidIssueKey(targetKey)) {
        throw new Error(`Invalid target issue key: ${targetKey}`);
      }

      if (sourceKey === targetKey) {
        throw new Error("Cannot link an issue to itself");
      }

      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      const linkTypes = await issueEndpoint.getLinkTypes();

      if (!opts.type) {
        if (format === "table" || format === "plain") {
          console.log(formatLinkTypes(linkTypes));
          console.log(
            chalk.yellow(
              "Please specify a link type using the --type option.\n" +
                "Example: scry issue link PROJ-123 PROJ-456 --type Blocks"
            )
          );
        } else {
          output({ linkTypes }, format);
        }
        return;
      }

      const linkType = findLinkType(opts.type, linkTypes);

      if (!linkType) {
        throw new Error(
          `Unknown link type: "${opts.type}". Use the command without --type to see available link types.`
        );
      }

      await issueEndpoint.link(sourceKey, targetKey, linkType.name);

      const result: LinkResult = {
        success: true,
        sourceKey,
        targetKey,
        linkType: linkType.name,
        message: `Successfully linked ${sourceKey} to ${targetKey} with type "${linkType.name}"`,
      };

      if (format === "table" || format === "plain") {
        console.log(formatLinkResult(result, format));
      } else {
        output(result, format);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      process.exit(1);
    }
  });
