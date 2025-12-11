import { Command } from "commander";
import { listCommand } from "./list.ts";
import { viewCommand } from "./view.ts";
import { createCommand } from "./create.ts";
import { cloneCommand } from "./clone.ts";
import { assignCommand } from "./assign.ts";
import { moveCommand } from "./move.ts";
import { editCommand } from "./edit.ts";
import { commentCommand } from "./comment.ts";
import { deleteCommand } from "./delete.ts";
import { worklogCommand } from "./worklog.ts";
import { linkCommand } from "./link.ts";
import { unlinkCommand } from "./unlink.ts";

export const issueCommand = new Command("issue")
  .description("Manage Jira issues")
  .addCommand(listCommand)
  .addCommand(viewCommand)
  .addCommand(createCommand)
  .addCommand(cloneCommand)
  .addCommand(assignCommand)
  .addCommand(moveCommand)
  .addCommand(editCommand)
  .addCommand(commentCommand)
  .addCommand(deleteCommand)
  .addCommand(worklogCommand)
  .addCommand(linkCommand)
  .addCommand(unlinkCommand);
