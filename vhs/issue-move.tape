# Demo: scry issue move - Transition issues through workflow
# Generates: ../docs/images/demos/issue-move.gif

Output ../docs/images/demos/issue-move.gif

Source common.tape

Require scry

Type "# See available transitions for an issue"
Enter
Sleep 500ms

Type "scry issue move PROJ-123"
Enter
Sleep 2s

# Interactive selection
Type "# Select a transition interactively"
Enter
Sleep 300ms

Type "scry issue move PROJ-123 -i"
Enter
Sleep 1s

# Navigate and select
Down
Sleep 300ms
Down
Sleep 300ms
Enter
Sleep 2s

# Direct transition
Type "# Or specify the target status directly"
Enter
Sleep 300ms

Type 'scry issue move PROJ-124 "In Review"'
Enter
Sleep 2s

# Dry run
Type "# Preview the transition"
Enter
Sleep 300ms

Type 'scry issue move PROJ-125 "Done" --dry-run'
Enter
Sleep 2s
