import { Command } from "commander";
import { input, editor, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { VersionEndpoint } from "../../../api/endpoints/version.ts";
import { ProjectEndpoint } from "../../../api/endpoints/project.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { CreateVersionRequest, Version } from "../../../api/types/version.ts";
import { success } from "../../../utils/messages.ts";
import { addGlobalOptionsHelp } from "../../help.ts";

function parseDate(dateStr?: string): string | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return date.toISOString();
}

function formatCreatedVersion(version: Version, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    return (
      success("Release created successfully!") +
      "\n" +
      chalk.cyan(`ID: ${version.id}\n`) +
      chalk.cyan(`Name: ${version.name}\n`) +
      (version.description ? chalk.dim(`Description: ${version.description}\n`) : "") +
      (version.releaseDate
        ? chalk.dim(`Release Date: ${version.releaseDate.split("T")[0]}\n`)
        : "") +
      (version.startDate ? chalk.dim(`Start Date: ${version.startDate.split("T")[0]}\n`) : "") +
      chalk.cyan(`Status: ${version.released ? "released" : "unreleased"}\n`) +
      chalk.dim(`URL: ${version.self}`)
    );
  }
  return "";
}

export const createCommand = new Command("create")
  .alias("new")
  .description("Create a new release/version")
  .option("-p, --project <key>", "Project key")
  .option("-n, --name <name>", "Release name")
  .option("-d, --description <text>", "Release description")
  .option(
    "-r, --release-date <date>",
    "Release date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)"
  )
  .option(
    "-s, --start-date <date>",
    "Start date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)"
  )
  .option("--released", "Mark as released")
  .option("--archived", "Mark as archived")
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
    const versionEndpoint = new VersionEndpoint(client);
    const projectEndpoint = new ProjectEndpoint(client);

    let projectKey = opts["project"] as string | undefined;
    let name = opts["name"] as string | undefined;
    let description = opts["description"] as string | undefined;
    let releaseDate = opts["releaseDate"] as string | undefined;
    let startDate = opts["startDate"] as string | undefined;
    let released = opts["released"] as boolean | undefined;
    let archived = opts["archived"] as boolean | undefined;

    const needsInteractive = opts["interactive"] || !projectKey || !name;

    if (needsInteractive) {
      if (format === "table" || format === "plain") {
        console.log(chalk.cyan("\nCreate a new release/version\n"));
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

      if (!name) {
        name = await input({
          message: "Release name:",
          validate: (value) => {
            if (!value.trim()) {
              return "Release name is required";
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
              message: "Enter release description:",
            });
          }
        }
      }

      if (!releaseDate) {
        const shouldAddReleaseDate = await input({
          message: "Release date (YYYY-MM-DD or ISO 8601, press Enter to skip):",
        });

        if (shouldAddReleaseDate.trim()) {
          releaseDate = shouldAddReleaseDate;
        }
      }

      if (!startDate) {
        const shouldAddStartDate = await input({
          message: "Start date (YYYY-MM-DD or ISO 8601, press Enter to skip):",
        });

        if (shouldAddStartDate.trim()) {
          startDate = shouldAddStartDate;
        }
      }

      if (released === undefined) {
        released = await confirm({
          message: "Mark as released?",
          default: false,
        });
      }

      if (archived === undefined) {
        archived = await confirm({
          message: "Mark as archived?",
          default: false,
        });
      }
    } else {
      projectKey = projectKey || projectKeyGlobal || config.project?.key;
      if (!projectKey) {
        throw new Error("Project key is required. Use --project flag or set default project.");
      }
    }

    if (!projectKey || !name) {
      throw new Error("Missing required fields: project key and name are required");
    }

    const project = await projectEndpoint.get(projectKey);
    const projectId = parseInt(project.id, 10);
    if (isNaN(projectId)) {
      throw new Error(`Invalid project ID: ${project.id}`);
    }

    const request: CreateVersionRequest = {
      name,
      projectId,
    };

    if (description && description.trim()) {
      request.description = description;
    }

    if (releaseDate && releaseDate.trim()) {
      request.releaseDate = parseDate(releaseDate);
    }

    if (startDate && startDate.trim()) {
      request.startDate = parseDate(startDate);
    }

    if (released !== undefined) {
      request.released = released;
    }

    if (archived !== undefined) {
      request.archived = archived;
    }

    if (globalOpts["debug"]) {
      console.log(chalk.dim("\nCreating release with request:"));
      console.log(chalk.dim(JSON.stringify(request, null, 2)));
      console.log("");
    }

    const createdVersion = await versionEndpoint.create(request);

    if (format === "table" || format === "plain") {
      console.log(formatCreatedVersion(createdVersion, format));
    } else {
      output(createdVersion, format);
    }
  } catch (err) {
    outputError(err instanceof Error ? err : String(err), format);
    throw err;
  }
});
