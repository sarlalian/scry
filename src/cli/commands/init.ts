import { Command } from "commander";
import { input, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import {
  ConfigManager,
  getDefaultConfigPath,
  type ConfigSchema,
  type AuthType,
} from "../../config/index.ts";
import { JiraClient } from "../../api/client.ts";
import { UserEndpoint } from "../../api/endpoints/user.ts";
import { success, warning } from "../../utils/messages.ts";

export const initCommand = new Command("init")
  .description("Initialize scry configuration")
  .option("--force", "Overwrite existing configuration")
  .action(async (opts) => {
    const configManager = new ConfigManager();
    const configPath = getDefaultConfigPath();

    try {
      const existingConfig = configManager.loadOrDefault();
      if (existingConfig.server && !opts["force"]) {
        const overwrite = await confirm({
          message: `Configuration already exists at ${configPath}. Overwrite?`,
          default: false,
        });
        if (!overwrite) {
          console.log(warning("Configuration unchanged."));
          return;
        }
      }
    } catch {
      // No existing config, continue
    }

    console.log(chalk.cyan("\nWelcome to Scry! Let's set up your Jira connection.\n"));

    const server = await input({
      message: "Jira server URL:",
      default: "https://your-domain.atlassian.net",
      validate: (value) => {
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
          return "Please enter a valid URL starting with http:// or https://";
        }
        return true;
      },
    });

    const login = await input({
      message: "Your email address:",
      validate: (value) => {
        if (!value.includes("@")) {
          return "Please enter a valid email address";
        }
        return true;
      },
    });

    const authType = await select<AuthType>({
      message: "Authentication type:",
      choices: [
        { value: "basic", name: "Basic Auth (email + API token)" },
        { value: "bearer", name: "Bearer Token (Personal Access Token)" },
      ],
      default: "basic",
    });

    console.log(chalk.dim("\nYou'll need to set the SCRY_API_TOKEN environment variable."));
    console.log(
      chalk.dim(
        "Generate an API token at: https://id.atlassian.com/manage-profile/security/api-tokens\n"
      )
    );

    const projectKey = await input({
      message: "Default project key (optional):",
    });

    const config: ConfigSchema = {
      server: server.replace(/\/$/, ""),
      login,
      auth: {
        type: authType,
      },
      project: projectKey ? { key: projectKey } : undefined,
      output: {
        format: "table",
        colors: true,
      },
    };

    const testConnection = await confirm({
      message: "Test connection now? (requires SCRY_API_TOKEN to be set)",
      default: true,
    });

    if (testConnection) {
      const token = process.env["SCRY_API_TOKEN"];
      if (!token) {
        console.log("\n" + warning("SCRY_API_TOKEN not set. Skipping connection test."));
        console.log(chalk.dim("Set it with: export SCRY_API_TOKEN=your-token\n"));
      } else {
        console.log(chalk.dim("\nTesting connection..."));
        try {
          const fullConfig = {
            server: config.server ?? "",
            login: config.login ?? "",
            auth: { type: config.auth?.type ?? "basic", token },
            project: config.project ?? {},
            board: {},
            epic: {},
            issue: { types: [] },
            output: config.output ?? { format: "table" as const, colors: true },
          };
          const client = new JiraClient(fullConfig);
          const userEndpoint = new UserEndpoint(client);
          const user = await userEndpoint.getMyself();
          console.log(
            "\n" +
              success(`Connected successfully as ${user.displayName} (${user.emailAddress})`) +
              "\n"
          );
        } catch (err) {
          console.log(
            chalk.red(`\nConnection failed: ${err instanceof Error ? err.message : String(err)}`)
          );
          console.log(chalk.dim("Check your credentials and try again.\n"));
        }
      }
    }

    configManager.save(config, configPath);
    console.log(success(`Configuration saved to ${configPath}`));
    console.log(chalk.dim("\nYou can now use scry! Try: scry me"));
  });
