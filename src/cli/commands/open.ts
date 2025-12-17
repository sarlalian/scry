import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../config/index.ts";
import { openInBrowser } from "../../utils/browser.ts";
import {
  detectResourceType,
  buildIssueUrl,
  buildProjectUrl,
  buildBoardUrl,
  buildSprintUrl,
} from "../../utils/url-builder.ts";
import { outputError, type OutputFormat } from "../../output/index.ts";
import { success } from "../../utils/messages.ts";
import { requireValidIssueKey } from "../../utils/validation.ts";

interface OpenOptions {
  board?: string;
  sprint?: string;
}

export const openCommand = new Command("open")
  .description("Open a Jira resource in the browser")
  .argument("[resource]", "Issue key (PROJ-123), project key (PROJ), or board/sprint ID")
  .option("-b, --board <id>", "Board ID to open")
  .option("-s, --sprint <id>", "Sprint ID to open (requires --board)")
  .action(async function (this: Command, resource?: string, options?: OpenOptions) {
    const parent = this.parent;
    const opts = parent?.opts() ?? {};
    const format = (opts["output"] as OutputFormat) ?? "table";

    try {
      const configManager = getConfigManager();
      const config = configManager.load(opts["config"] as string | undefined);

      if (!config.server) {
        throw new Error('No server configured. Run "scry init" to configure.');
      }

      let url: string;

      if (options?.sprint) {
        const boardId = options.board ?? config.board.id;
        if (!boardId) {
          throw new Error("--sprint requires --board to be specified or configured");
        }
        url = buildSprintUrl(config.server, boardId, options.sprint);
        console.log(chalk.dim(`Opening sprint ${options.sprint} on board ${boardId}...`));
      } else if (options?.board) {
        url = buildBoardUrl(config.server, options.board);
        console.log(chalk.dim(`Opening board ${options.board}...`));
      } else if (resource) {
        const normalizedResource = resource.toUpperCase();
        const resourceType = detectResourceType(normalizedResource);

        switch (resourceType) {
          case "issue":
            requireValidIssueKey(normalizedResource);
            url = buildIssueUrl(config.server, normalizedResource);
            console.log(chalk.dim(`Opening issue ${normalizedResource}...`));
            break;
          case "project":
            url = buildProjectUrl(config.server, normalizedResource);
            console.log(chalk.dim(`Opening project ${normalizedResource}...`));
            break;
          default:
            throw new Error(`Invalid resource format: ${resource}`);
        }
      } else {
        throw new Error("Must provide a resource (issue/project key, --board, or --sprint)");
      }

      await openInBrowser(url);
      console.log(success(`Opened: ${url}`));
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
