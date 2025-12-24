# Demo: scry init - Initialize scry configuration
# Generates: ../docs/images/demos/init.gif

Output ../docs/images/demos/init.gif

Source common.tape

Require scry

# Title
Type "# Initialize scry for the first time"
Enter
Sleep 500ms

Type "scry init"
Enter
Sleep 1s

# Jira server URL prompt
Type "https://mycompany.atlassian.net"
Sleep 300ms
Enter
Sleep 500ms

# Email prompt
Type "developer@mycompany.com"
Sleep 300ms
Enter
Sleep 500ms

# Auth type selection (accept default 'basic')
Sleep 300ms
Enter
Sleep 500ms

# Default project
Type "PROJ"
Sleep 300ms
Enter
Sleep 1s

# Show success message
Sleep 2s

# Verify configuration works
Type "# Verify the connection"
Enter
Sleep 300ms

Type "scry me"
Enter
Sleep 2s
