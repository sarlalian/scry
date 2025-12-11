# Release Command Documentation

## Overview

The Scry project uses GitHub Actions to automate the release process. When a version tag is pushed, the workflow automatically builds binaries for all supported platforms and creates a GitHub release.

## Supported Platforms

| Platform | Architecture | Binary Name Format |
|----------|-------------|-------------------|
| Linux | x64 | `scry-{version}-linux-x64` |
| Linux | ARM64 | `scry-{version}-linux-arm64` |
| macOS | x64 | `scry-{version}-darwin-x64` |
| macOS | ARM64 | `scry-{version}-darwin-arm64` |
| Windows | x64 | `scry-{version}-windows-x64.exe` |

## Quick Start

```bash
# 1. Update version in package.json
vim package.json  # Update "version" field

# 2. Commit the version change
git add package.json
git commit -m "chore: bump version to 0.2.0"
git push origin main

# 3. Create and push annotated tag
git tag -a v0.2.0 -m "Release v0.2.0

Added:
- Feature X
- Feature Y

Fixed:
- Bug Z"

git push origin v0.2.0
```

## Release Process Details

### 1. Pre-Release Checks

The workflow runs these checks before building:
- Type checking (`bun run typecheck`)
- Linting (`bun run lint`)
- Tests (`bun test`)

If any check fails, the release is aborted.

### 2. Binary Building

Binaries are built using Bun's compile feature with cross-compilation:

```bash
bun build --compile --target=bun-{platform}-{arch} --outfile dist/scry src/index.ts
```

Target strings:
- `bun-linux-x64` - Linux x64
- `bun-linux-aarch64` - Linux ARM64
- `bun-darwin-x64` - macOS Intel
- `bun-darwin-aarch64` - macOS Apple Silicon
- `bun-windows-x64` - Windows x64

### 3. Checksum Generation

SHA-256 checksums are generated for each binary:
- Individual `.sha256` files alongside each binary
- Combined `checksums.txt` with all hashes

### 4. Release Creation

The workflow creates a GitHub release with:
- Release notes (from tag annotation or CHANGELOG.md)
- All platform binaries
- Checksum files
- Pre-release flag (if version contains hyphen)

## Version Numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):

### Stable Releases
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git tag -a v1.1.0 -m "Release v1.1.0"
git tag -a v1.1.1 -m "Release v1.1.1"
```

### Pre-Releases
Tags with hyphens are marked as pre-releases:

```bash
# Alpha
git tag -a v1.0.0-alpha.1 -m "Alpha release"

# Beta
git tag -a v1.0.0-beta.1 -m "Beta release"

# Release Candidate
git tag -a v1.0.0-rc.1 -m "Release candidate"
```

## Release Notes

### Using Tag Annotation (Recommended)

Create detailed release notes in the tag message:

```bash
git tag -a v0.2.0 -m "Release v0.2.0

## What's Changed

### Added
- New feature X that does Y
- Support for Z functionality
- Interactive mode for A command

### Changed
- Improved performance of B by 50%
- Updated C to use new API

### Fixed
- Bug in D that caused E
- Issue with F when G

### Breaking Changes
- Command H now requires I parameter

## Installation

See installation instructions in the release notes.

## Full Changelog
https://github.com/sarlalian/scry/compare/v0.1.0...v0.2.0"
```

### Using CHANGELOG.md

Maintain a `CHANGELOG.md` file in the root:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-12-10

### Added
- New feature X
- Support for Y

### Changed
- Updated Z

### Fixed
- Bug in A

## [0.1.0] - 2024-12-01

Initial release.
```

The workflow automatically extracts the relevant section for the release.

## Workflow File

Location: `.github/workflows/release.yml`

### Jobs

1. **build-and-release** (matrix job)
   - Runs on: ubuntu-latest, macos-latest, windows-latest
   - Builds binaries for all platforms
   - Generates checksums
   - Uploads artifacts

2. **create-release**
   - Runs after: build-and-release
   - Downloads all artifacts
   - Generates combined checksums
   - Creates GitHub release

### Triggers

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

Triggered by tags matching semantic versioning pattern (v1.2.3).

## Manual Testing

Test the build process locally before creating a release:

```bash
# Build for current platform
bun run build:local

# Test the binary
./dist/scry --version
./dist/scry --help
./dist/scry me  # Test auth
```

## Troubleshooting

### Build Fails on CI

**Problem**: Build fails with "target not found" error

**Solution**: Ensure Bun version in CI supports cross-compilation (>= 1.1.8)

### Tests Fail on Windows

**Problem**: Path separator issues in tests

**Solution**: Use `path.join()` or `path.resolve()` instead of string concatenation

### Binary Doesn't Execute

**Problem**: "Illegal instruction" error on older CPUs

**Solution**: Consider adding `-baseline` builds for x64 platforms in future

### Release Already Exists

**Problem**: Tag already exists on GitHub

**Solution**: Delete both tag and release:
```bash
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0
# Then delete release on GitHub UI
```

## Best Practices

1. **Test locally first**
   ```bash
   bun run check  # typecheck, lint, test
   bun run build:local
   ./dist/scry --version
   ```

2. **Use annotated tags**
   ```bash
   git tag -a v0.2.0 -m "..."  # Always use -a flag
   ```

3. **Update CHANGELOG.md**
   - Keep it current with every release
   - Follow Keep a Changelog format

4. **Verify the release**
   - Check GitHub releases page
   - Download and test binaries
   - Verify checksums

5. **Communicate**
   - Announce release in discussions/social media
   - Update documentation if needed
   - Close related issues/PRs

## Integration with justfile

The justfile includes a release helper:

```bash
just release 0.2.0  # Builds with VERSION env var
```

However, this only builds locally. The GitHub Actions workflow is the authoritative release process.

## Future Enhancements

Potential improvements for the release workflow:

1. **Baseline builds** for older x64 CPUs
2. **Homebrew formula** auto-update
3. **Docker image** publishing
4. **npm package** publishing (optional)
5. **Release announcement** automation
6. **Binary signing** for macOS/Windows
7. **Automated testing** of release binaries
8. **Changelog auto-generation** from commits

## See Also

- [Release Workflow Guide](../release-workflow.md)
- [Getting Started](../getting-started.md)
- [Bun Executables Documentation](https://bun.com/docs/bundler/executables)
