import { Command } from "commander";
import chalk from "chalk";
import { getConfigManager } from "../../../config/index.ts";
import { JiraClient } from "../../../api/client.ts";
import { IssueEndpoint } from "../../../api/endpoints/issue.ts";
import { UserEndpoint } from "../../../api/endpoints/user.ts";
import { output, outputError, type OutputFormat } from "../../../output/index.ts";
import type { User } from "../../../api/types/user.ts";
import { requireValidIssueKey } from "../../../utils/validation.ts";
import { success, error } from "../../../utils/messages.ts";

interface AssignResult {
  success: boolean;
  issueKey: string;
  assignee: {
    accountId: string | null;
    displayName: string | null;
  };
  message: string;
}

function isAccountId(value: string): boolean {
  return /^[a-f0-9]{24}$/.test(value) || value.includes(":");
}

function normalizeAssignee(assignee: string): string | null {
  const trimmed = assignee.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.toLowerCase();
  if (normalized === "-" || normalized === "none" || normalized === "unassigned") {
    return null;
  }
  return assignee;
}

function isMe(assignee: string): boolean {
  return assignee.trim().toLowerCase() === "me";
}

async function resolveAssignee(
  assigneeInput: string,
  userEndpoint: UserEndpoint
): Promise<{ accountId: string | null; displayName: string | null }> {
  const normalized = normalizeAssignee(assigneeInput);

  if (normalized === null) {
    return { accountId: null, displayName: null };
  }

  if (isMe(assigneeInput)) {
    const currentUser = await userEndpoint.getMyself();
    return { accountId: currentUser.accountId, displayName: currentUser.displayName };
  }

  if (isAccountId(assigneeInput)) {
    try {
      const user = await userEndpoint.getUser(assigneeInput);
      return { accountId: user.accountId, displayName: user.displayName };
    } catch {
      return { accountId: assigneeInput, displayName: null };
    }
  }

  const searchResults = await userEndpoint.search(assigneeInput);

  if (searchResults.length === 0) {
    throw new Error(
      `No user found matching "${assigneeInput}". Please provide a valid account ID, email, or display name.`
    );
  }

  if (searchResults.length > 1) {
    const names = searchResults.map((u) => `${u.displayName} (${u.emailAddress})`).join(", ");
    throw new Error(
      `Multiple users found matching "${assigneeInput}": ${names}. Please provide a more specific search term or use the account ID.`
    );
  }

  const user = searchResults[0] as User;
  return { accountId: user.accountId, displayName: user.displayName };
}

function formatAssignResult(result: AssignResult, format: OutputFormat): string {
  if (format === "table" || format === "plain") {
    let message = "";
    if (result.success) {
      message = success(result.message) + "\n";
    } else {
      message = error(result.message) + "\n";
    }
    message += chalk.dim(`Issue: ${result.issueKey}\n`);

    if (result.assignee.displayName) {
      message += chalk.dim(`Assignee: ${result.assignee.displayName}`);
    } else if (result.assignee.accountId) {
      message += chalk.dim(`Assignee: ${result.assignee.accountId}`);
    } else {
      message += chalk.dim(`Assignee: Unassigned`);
    }

    return message;
  }
  return "";
}

export const assignCommand = new Command("assign")
  .description("Assign an issue to a user")
  .argument("<issue-key>", "Issue key (e.g., PROJ-123)")
  .argument(
    "<assignee>",
    "Assignee (account ID, email, display name, 'me', or '-'/'none'/'unassigned' to unassign)"
  )
  .action(async function (this: Command, issueKey: string, assignee: string) {
    const parent = this.parent?.parent;
    const globalOpts = parent?.opts() ?? {};
    const format = (globalOpts["output"] as OutputFormat) ?? "table";

    try {
      requireValidIssueKey(issueKey);

      const configManager = getConfigManager();
      const config = configManager.load(globalOpts["config"] as string | undefined);
      const client = new JiraClient(config);
      const issueEndpoint = new IssueEndpoint(client);
      const userEndpoint = new UserEndpoint(client);

      const resolved = await resolveAssignee(assignee, userEndpoint);

      await issueEndpoint.assign(issueKey, resolved.accountId);

      const result: AssignResult = {
        success: true,
        issueKey,
        assignee: resolved,
        message:
          resolved.accountId === null
            ? `Issue ${issueKey} has been unassigned`
            : `Issue ${issueKey} has been assigned to ${resolved.displayName ?? resolved.accountId}`,
      };

      if (format === "table" || format === "plain") {
        console.log(formatAssignResult(result, format));
      } else {
        output(result, format);
      }
    } catch (err) {
      outputError(err instanceof Error ? err : String(err), format);
      throw err;
    }
  });
