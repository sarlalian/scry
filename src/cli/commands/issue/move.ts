import { Command } from "commander";
import chalk from "chalk";
import { select } from "@inquirer/prompts";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import {
  output,
  outputError,
  type OutputFormat,
  TableFormatter,
  type TableColumn,
} from "../../../output/index.ts";
import type { Transition } from "../../../api/types/issue.ts";

interface TransitionTableRow {
  id: string;
  name: string;
  to: string;
  available: string;
}

function formatTransitionsForTable(transitions: Transition[]): TransitionTableRow[] {
  return transitions.map((t) => ({
    id: t.id,
    name: t.name,
    to: t.to.name,
    available: t.isAvailable ? "Yes" : "No",
  }));
}

function findTransitionByStatus(
  transitions: Transition[],
  targetStatus: string
): Transition | undefined {
  const normalizedTarget = targetStatus.toLowerCase().trim();
  return transitions.find(
    (t) => t.name.toLowerCase() === normalizedTarget || t.to.name.toLowerCase() === normalizedTarget
  );
}

export const moveCommand = new Command("move")
  .alias("transition")
  .description("Move issue through workflow transitions")
  .argument("<issue-key>", "Issue key (e.g., PROJ-123)")
  .argument("[target-status]", "Target status or transition name")
  .option("-i, --interactive", "Select transition interactively")
  .action(async function (
    this: Command,
    issueKey: string,
    targetStatus?: string,
    opts?: Record<string, unknown>
  ) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";
    const interactive = opts?.["interactive"] as boolean | undefined;

    try {
      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);

      const transitions = await issueEndpoint.getTransitions(issueKey);

      if (transitions.length === 0) {
        if (format === "table" || format === "plain") {
          console.log(chalk.yellow(`No transitions available for ${issueKey}`));
        } else {
          outputError("No transitions available", format);
        }
        process.exit(1);
      }

      if (!targetStatus && !interactive) {
        if (format === "table" || format === "plain") {
          console.log(chalk.cyan.bold(`Available transitions for ${issueKey}:`));
          console.log("");

          const columns: TableColumn[] = [
            { key: "id", header: "ID" },
            { key: "name", header: "Transition" },
            { key: "to", header: "To Status" },
            { key: "available", header: "Available" },
          ];
          const formatter = new TableFormatter(columns);
          const tableData = formatTransitionsForTable(transitions);
          const tableOutput = formatter.format({ data: tableData });
          console.log(tableOutput);

          console.log("");
          console.log(
            chalk.dim(`Use: scry issue move ${issueKey} <status> to transition the issue`)
          );
        } else {
          output(transitions, format);
        }
        return;
      }

      let selectedTransition: Transition | undefined;

      if (interactive || !targetStatus) {
        const availableTransitions = transitions.filter((t) => t.isAvailable);
        if (availableTransitions.length === 0) {
          console.log(chalk.yellow("No available transitions for this issue"));
          process.exit(1);
        }

        const answer = await select({
          message: `Select transition for ${issueKey}:`,
          choices: availableTransitions.map((t) => ({
            name: `${t.name} → ${t.to.name}`,
            value: t.id,
            description: t.to.statusCategory.name,
          })),
        });

        selectedTransition = availableTransitions.find((t) => t.id === answer);
      } else {
        selectedTransition = findTransitionByStatus(transitions, targetStatus);

        if (!selectedTransition) {
          if (format === "table" || format === "plain") {
            console.log(chalk.red(`No transition found for status: ${targetStatus}`));
            console.log("");
            console.log(chalk.dim("Available transitions:"));

            const columns: TableColumn[] = [
              { key: "id", header: "ID" },
              { key: "name", header: "Transition" },
              { key: "to", header: "To Status" },
              { key: "available", header: "Available" },
            ];
            const formatter = new TableFormatter(columns);
            const tableData = formatTransitionsForTable(transitions);
            const tableOutput = formatter.format({ data: tableData });
            console.log(tableOutput);
          } else {
            outputError(`No transition found for status: ${targetStatus}`, format);
          }
          process.exit(1);
        }

        if (!selectedTransition.isAvailable) {
          if (format === "table" || format === "plain") {
            console.log(
              chalk.red(`Transition "${selectedTransition.name}" is not available for ${issueKey}`)
            );
          } else {
            outputError(
              `Transition "${selectedTransition.name}" is not available for ${issueKey}`,
              format
            );
          }
          process.exit(1);
        }
      }

      if (!selectedTransition) {
        outputError("No transition selected", format);
        process.exit(1);
      }

      await issueEndpoint.transition(issueKey, selectedTransition.id);

      if (format === "table" || format === "plain") {
        console.log(
          chalk.green(
            `✓ Successfully moved ${issueKey} to ${chalk.bold(selectedTransition.to.name)}`
          )
        );
      } else {
        output(
          {
            issueKey,
            transition: selectedTransition.name,
            status: selectedTransition.to.name,
            success: true,
          },
          format
        );
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      process.exit(1);
    }
  });
