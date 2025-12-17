import chalk from "chalk";

/**
 * Standardized message formatting utilities for consistent CLI output
 */

/**
 * Format a success message with green checkmark
 */
export function success(message: string): string {
  return `${chalk.green("✓")} ${message}`;
}

/**
 * Format an error message with red X
 */
export function error(message: string): string {
  return `${chalk.red("✗")} ${message}`;
}

/**
 * Format a warning message with yellow warning symbol
 */
export function warning(message: string): string {
  return `${chalk.yellow("⚠")} ${message}`;
}

/**
 * Format an info message with blue info symbol
 */
export function info(message: string): string {
  return `${chalk.blue("ℹ")} ${message}`;
}
