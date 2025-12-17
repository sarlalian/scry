import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../config/index.ts";
import { JiraClient } from "../../api/client.ts";
import { UserEndpoint } from "../../api/endpoints/user.ts";
import { output, outputError, type OutputFormat } from "../../output/index.ts";

export const meCommand = new Command("me")
  .description("Get current user information")
  .action(async function (this: Command) {
    const parent = this.parent;
    const opts = parent?.opts() ?? {};
    const format = (opts["output"] as OutputFormat) ?? "table";

    try {
      const configManager = getConfigManager();
      const config = configManager.load(opts["config"] as string | undefined);
      const client = new JiraClient(config);
      const userEndpoint = new UserEndpoint(client);

      const user = await userEndpoint.getMyself();

      if (format === "plain") {
        console.log(user.accountId);
      } else if (format === "table") {
        console.log(chalk.cyan.bold(user.displayName));
        console.log(`${chalk.dim("Email:")}      ${user.emailAddress ?? "-"}`);
        console.log(`${chalk.dim("Account ID:")} ${user.accountId}`);
        console.log(
          `${chalk.dim("Active:")}     ${user.active ? chalk.green("Yes") : chalk.red("No")}`
        );
        if (user.timeZone) {
          console.log(`${chalk.dim("Timezone:")}   ${user.timeZone}`);
        }
      } else {
        output(user, format);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
