# Release Workflow

This document describes how to create releases for Scry using the automated GitHub Actions workflow.

## Overview

The release workflow automatically builds cross-platform binaries and creates GitHub releases when you push a version tag. It supports:

- **Linux**: x64 and ARM64
- **macOS**: x64 and ARM64 (Apple Silicon)
- **Windows**: x64

## Creating a Release

### 1. Prepare the Release

Before creating a release, ensure:

1. All changes are committed and pushed to main
2. Tests pass: `bun test`
3. Type checking passes: `bun run typecheck`
4. Linting passes: `bun run lint`
5. Local build works: `bun run build:local`

### 2. Update Version

Update the version in `package.json`:

```json
{
  "version": "0.2.0"
}
```

Commit the version change:

```bash
git add package.json
git commit -m "chore: bump version to 0.2.0"
git push origin main
```

### 3. Create and Push Tag

Create an annotated tag with release notes:

```bash
# Create annotated tag with message
git tag -a v0.2.0 -m "Release v0.2.0

## What's Changed

- Add new feature X
- Fix bug Y
- Improve performance of Z

See CHANGELOG.md for full details."

# Push the tag
git push origin v0.2.0
```

The workflow will automatically:
1. Build binaries for all platforms
2. Run tests on each platform
3. Generate checksums for verification
4. Create a GitHub release with all artifacts
5. Attach release notes from the tag message or CHANGELOG.md

## Release Artifacts

Each release includes:

- `scry-{version}-linux-x64` - Linux x64 binary
- `scry-{version}-linux-arm64` - Linux ARM64 binary
- `scry-{version}-darwin-x64` - macOS x64 binary
- `scry-{version}-darwin-arm64` - macOS ARM64 (Apple Silicon) binary
- `scry-{version}-windows-x64.exe` - Windows x64 binary
- Individual `.sha256` files for each binary
- `checksums.txt` - Combined checksums file

## Release Types

### Stable Release

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
```

### Pre-release (Alpha/Beta/RC)

Tags containing hyphens are automatically marked as pre-releases:

```bash
git tag -a v1.0.0-beta.1 -m "Beta release v1.0.0-beta.1"
git tag -a v1.0.0-rc.1 -m "Release candidate v1.0.0-rc.1"
```

## Release Notes

The workflow generates release notes in this priority order:

1. **Tag annotation message** (recommended)
   ```bash
   git tag -a v0.2.0 -m "Detailed release notes here..."
   ```

2. **CHANGELOG.md** (if it exists)
   - The workflow extracts the section for the current version

3. **Default template** (fallback)
   - Auto-generated installation instructions

### Recommended CHANGELOG.md Format

```markdown
# Changelog

## [0.2.0] - 2024-12-10

### Added
- New feature X
- Support for Y

### Changed
- Updated Z implementation

### Fixed
- Bug in A
- Issue with B

## [0.1.0] - 2024-12-01
...
```

## Workflow Details

### Build Matrix

The workflow runs parallel builds on:
- Ubuntu (for Linux builds)
- macOS (for Darwin builds)
- Windows (for Windows builds)

### Quality Checks

Each build runs:
1. Type checking (`bun run typecheck`)
2. Linting (`bun run lint`)
3. Tests (`bun test`)

If any check fails, the release is aborted.

### Checksums

SHA-256 checksums are generated for each binary:
- Individual `.sha256` files alongside each binary
- Combined `checksums.txt` file with all checksums

Users can verify downloads:
```bash
sha256sum -c checksums.txt
```

## Manual Release (Not Recommended)

If you need to create a release manually:

```bash
# Build for all platforms
bun run build

# The binaries will be in the dist/ directory
```

However, using the automated workflow is strongly recommended as it:
- Ensures consistent builds
- Runs all quality checks
- Generates proper checksums
- Creates properly formatted releases

## Troubleshooting

### Workflow Fails on Tests

Ensure all tests pass locally before pushing the tag:
```bash
bun test
```

### Wrong Version in Binaries

The version comes from `package.json`. Make sure to:
1. Update `package.json`
2. Commit the change
3. Then create the tag

### Release Already Exists

If you need to recreate a release:
1. Delete the tag locally: `git tag -d v0.2.0`
2. Delete the tag on GitHub: `git push origin :refs/tags/v0.2.0`
3. Delete the release on GitHub (via web UI)
4. Create a new tag and push

## Best Practices

1. **Always use annotated tags** (`-a` flag) with meaningful messages
2. **Test locally first** before creating the tag
3. **Update CHANGELOG.md** before releasing
4. **Use semantic versioning** (MAJOR.MINOR.PATCH)
5. **Create pre-releases** for beta/RC versions
6. **Verify the release** after the workflow completes

## GitHub Actions Permissions

The workflow requires `contents: write` permission to:
- Upload release artifacts
- Create GitHub releases

This is configured in the workflow file and uses the automatic `GITHUB_TOKEN`.

## Monitoring Releases

View release workflow runs:
- Go to: https://github.com/sarlalian/scry/actions
- Filter by workflow: "Release"

View all releases:
- Go to: https://github.com/sarlalian/scry/releases
