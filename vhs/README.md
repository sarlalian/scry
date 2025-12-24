# VHS Tape Files for Scry Demos

This directory contains VHS tape files for generating animated GIF demonstrations of scry CLI workflows.

## Prerequisites

Install VHS from Charmbracelet:

```bash
# macOS
brew install charmbracelet/tap/vhs

# Linux (Debian/Ubuntu)
sudo apt install ffmpeg
go install github.com/charmbracelet/vhs@latest

# From source
go install github.com/charmbracelet/vhs@latest
```

You'll also need:
- `scry` built and available in PATH (run `bun run build:local`)
- A configured Jira connection (`scry init`)
- ffmpeg installed for video encoding

## Generating GIFs

Generate all GIFs:

```bash
cd vhs
for tape in *.tape; do
  [[ "$tape" != "common.tape" ]] && vhs "$tape"
done
```

Generate a specific GIF:

```bash
vhs init.tape
```

Or use the npm script from the project root:

```bash
bun run vhs:generate
```

## Tape Files

| File | Description | Output |
|------|-------------|--------|
| `common.tape` | Shared settings (font, colors, dimensions) | N/A |
| `init.tape` | First-time configuration wizard | `init.gif` |
| `issue-list.tape` | List and filter issues | `issue-list.gif` |
| `issue-view.tape` | View issue details | `issue-view.gif` |
| `issue-create.tape` | Create new issues | `issue-create.gif` |
| `issue-assign.tape` | Assign issues to users | `issue-assign.gif` |
| `issue-move.tape` | Transition issues through workflow | `issue-move.gif` |
| `output-formats.tape` | Different output format examples | `output-formats.gif` |

## Output

GIFs are generated to `../docs/images/demos/` for use in the documentation site.

## Customization

Edit `common.tape` to change shared settings:

- **FontSize**: Adjust for readability (default: 18)
- **Theme**: VHS supports many themes (Catppuccin Mocha, Dracula, etc.)
- **TypingSpeed**: Slower = more readable, faster = shorter GIFs
- **Width/Height**: Adjust dimensions for your use case

## Recording Tips

- Use realistic but anonymized data in demos
- Keep demos focused on one workflow each
- Add `Sleep` commands for readability at key moments
- Test tape files locally before committing

## Resources

- [VHS GitHub Repository](https://github.com/charmbracelet/vhs)
- [VHS Documentation](https://github.com/charmbracelet/vhs#vhs)
- [Available Themes](https://github.com/charmbracelet/vhs#themes)
