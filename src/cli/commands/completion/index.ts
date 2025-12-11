import { Command } from "commander";
import chalk from "chalk";
import { getCompletion, validateShell } from "./generators.ts";

export const completionCommand = new Command("completion")
  .description("Generate shell completion scripts")
  .argument("<shell>", "Shell type: bash, zsh, or fish")
  .action((shell: string) => {
    const normalizedShell = shell.toLowerCase();

    if (!validateShell(normalizedShell)) {
      console.error(
        chalk.red(`Error: Unsupported shell '${shell}'. Supported shells: bash, zsh, fish`)
      );
      console.error(chalk.dim("\nUsage: scry completion <bash|zsh|fish>"));
      process.exit(1);
    }

    try {
      const completionScript = getCompletion(normalizedShell);
      console.log(completionScript);
    } catch (err) {
      console.error(
        chalk.red(
          `Error generating completion: ${err instanceof Error ? err.message : String(err)}`
        )
      );
      process.exit(1);
    }
  });
