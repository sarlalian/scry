# Demo: scry issue create - Create new issues
# Generates: ../docs/images/demos/issue-create.gif

Output ../docs/images/demos/issue-create.gif

Source common.tape

Require scry

# Create with flags (non-interactive)
Type "# Create an issue with command flags"
Enter
Sleep 500ms

Type 'scry issue create -t Task -s "Implement user authentication" -y High -l backend,security'
Enter
Sleep 2s

# Show the created issue
Type "# The new issue was created"
Enter
Sleep 500ms

Type "scry issue view PROJ-456"
Enter
Sleep 2s

# Create a bug
Type "# Create a bug report"
Enter
Sleep 300ms

Type 'scry issue create -t Bug -s "Login fails with special characters" -y Critical'
Enter
Sleep 2s
