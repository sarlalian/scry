# Demo: scry issue assign - Assign issues to users
# Generates: ../docs/images/demos/issue-assign.gif

Output ../docs/images/demos/issue-assign.gif

Source common.tape

Require scry

Type "# Assign an issue to a team member"
Enter
Sleep 500ms

Type "scry issue assign PROJ-123 developer@mycompany.com"
Enter
Sleep 2s

Type "# Assign to yourself"
Enter
Sleep 300ms

Type "scry issue assign PROJ-124 me"
Enter
Sleep 2s

Type "# Unassign an issue"
Enter
Sleep 300ms

Type "scry issue assign PROJ-125 -"
Enter
Sleep 2s

Type "# Preview changes with dry-run"
Enter
Sleep 300ms

Type "scry issue assign PROJ-126 jane@mycompany.com --dry-run"
Enter
Sleep 2s
