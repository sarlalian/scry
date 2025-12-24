# Demo: scry issue view - View issue details
# Generates: ../docs/images/demos/issue-view.gif

Output ../docs/images/demos/issue-view.gif

Source common.tape

Require scry

Type "# View detailed issue information"
Enter
Sleep 500ms

Type "scry issue view PROJ-123"
Enter
Sleep 3s

# View with comments
Type "# Include recent comments"
Enter
Sleep 300ms

Type "scry issue view PROJ-123 --comments 3"
Enter
Sleep 3s

# Brief mode for AI agents
Type "# Brief output for scripting"
Enter
Sleep 300ms

Type "scry issue view PROJ-123 -o json --brief"
Enter
Sleep 2s
