# Demo: Output formats - table, json, csv, xml
# Generates: ../docs/images/demos/output-formats.gif

Output ../docs/images/demos/output-formats.gif

Source common.tape

Require scry

Type "# Default: table format"
Enter
Sleep 500ms

Type "scry issue list --limit 3"
Enter
Sleep 2s

Type "# JSON for scripting and AI agents"
Enter
Sleep 300ms

Type "scry issue list --limit 3 -o json"
Enter
Sleep 2s

Type "# CSV for spreadsheets"
Enter
Sleep 300ms

Type "scry issue list --limit 3 -o csv"
Enter
Sleep 2s

Type "# XML format"
Enter
Sleep 300ms

Type "scry issue list --limit 3 -o xml"
Enter
Sleep 2s

Type "# Pipe JSON to jq for processing"
Enter
Sleep 300ms

Type "scry issue list -o json --limit 3 | jq '.data[].key'"
Enter
Sleep 2s

Type "# Plain text (minimal)"
Enter
Sleep 300ms

Type "scry issue list --limit 3 -o plain"
Enter
Sleep 2s
