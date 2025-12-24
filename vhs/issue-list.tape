# Demo: scry issue list - List and filter issues
# Generates: ../docs/images/demos/issue-list.gif

Output ../docs/images/demos/issue-list.gif

Source common.tape

Require scry

# Basic list
Type "# List issues in the default project"
Enter
Sleep 500ms

Type "scry issue list --limit 5"
Enter
Sleep 2s

# Filter by assignee
Type "# Filter by current user"
Enter
Sleep 300ms

Type "scry issue list -a me --limit 5"
Enter
Sleep 2s

# Filter by status
Type "# Filter by status"
Enter
Sleep 300ms

Type 'scry issue list -s "In Progress" --limit 5'
Enter
Sleep 2s

# Combined filters
Type "# Combine filters: bugs with high priority"
Enter
Sleep 300ms

Type "scry issue list -t Bug -y High --limit 5"
Enter
Sleep 2s

# Custom columns
Type "# Custom columns"
Enter
Sleep 300ms

Type "scry issue list --columns key,summary,status,assignee --limit 5"
Enter
Sleep 2s
