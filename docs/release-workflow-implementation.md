# Release Workflow Implementation

**Status**: Complete
**Ticket**: scry-023
**Date**: 2024-12-10

## Overview

This document describes the implementation of the automated release workflow for the Scry project.

## Implementation Summary

A comprehensive GitHub Actions release workflow has been created that automatically builds cross-platform binaries and creates GitHub releases when version tags are pushed.

## Files Created

### 1. `.github/workflows/release.yml`

The main release workflow file with two jobs:

#### Job 1: `build-and-release`
- **Matrix Strategy**: Builds for 5 platform/architecture combinations
- **Platforms**:
  - Linux: x64, ARM64
  - macOS: x64, ARM64 (Apple Silicon)
  - Windows: x64
- **Quality Checks**: Runs typecheck, lint, and tests before building
- **Build Process**: Uses Bun's cross-compilation with `--target` flag
- **Checksums**: Generates SHA-256 checksums for each binary
- **Artifacts**: Uploads versioned binaries with checksums

#### Job 2: `create-release`
- **Depends On**: `build-and-release` (runs after all builds complete)
- **Downloads**: All artifacts from previous job
- **Checksums**: Combines individual checksums into single `checksums.txt`
- **Release Notes**: Extracts from tag annotation or CHANGELOG.md
- **Release Creation**: Creates GitHub release with all artifacts
- **Pre-release Detection**: Auto-marks pre-releases (versions with hyphens)

### 2. `docs/release-workflow.md`

Comprehensive user guide covering:
- Release creation process (step-by-step)
- Artifact naming and verification
- Release types (stable vs pre-release)
- Release notes best practices
- Troubleshooting common issues
- Best practices and recommendations

### 3. `docs/commands/release.md`

Technical reference documentation covering:
- Platform support matrix
- Quick start guide
- Build process details
- Version numbering conventions
- Tag annotation examples
- CHANGELOG.md format
- Workflow architecture
- Integration points

### 4. `docs/release-workflow-implementation.md`

This document - implementation summary and technical details.

## Technical Details

### Build Targets

The workflow uses Bun's cross-compilation feature with these targets:

| Platform | Architecture | Bun Target | Binary Name Format |
|----------|-------------|------------|-------------------|
| Linux | x64 | `bun-linux-x64` | `scry-{version}-linux-x64` |
| Linux | ARM64 | `bun-linux-aarch64` | `scry-{version}-linux-arm64` |
| macOS | x64 | `bun-darwin-x64` | `scry-{version}-darwin-x64` |
| macOS | ARM64 | `bun-darwin-aarch64` | `scry-{version}-darwin-arm64` |
| Windows | x64 | `bun-windows-x64` | `scry-{version}-windows-x64.exe` |

### Build Command

```bash
bun build --compile --target={bun-target} --outfile dist/{artifact-name} src/index.ts
```

### Checksum Generation

**Unix/macOS**:
```bash
shasum -a 256 {binary} > {binary}.sha256
```

**Windows**:
```powershell
$hash = (Get-FileHash -Algorithm SHA256 {binary}).Hash.ToLower()
"$hash  {binary}" | Out-File -Encoding ASCII {binary}.sha256
```

### Release Notes Priority

1. **Tag annotation message** (recommended)
2. **CHANGELOG.md** (extracted via sed)
3. **Default template** (auto-generated)

## Workflow Features

### Quality Assurance

Each build runs:
- ✅ Type checking (`bun run typecheck`)
- ✅ Linting (`bun run lint`)
- ✅ Tests (`bun test`)

### Security

- Uses minimal permissions (`contents: write`)
- Uses automatic `GITHUB_TOKEN`
- No third-party secrets required
- Checksums for binary verification

### Performance

- Parallel builds using matrix strategy
- Caching via GitHub Actions artifacts
- Efficient dependency installation with `--frozen-lockfile`

### User Experience

- Clear binary naming with version and platform
- Combined checksums file for easy verification
- Detailed release notes with installation instructions
- Pre-release auto-detection
- GitHub Step Summary with artifact list

## Release Process

### For Maintainers

```bash
# 1. Update version
vim package.json  # Update "version": "0.2.0"

# 2. Commit
git add package.json
git commit -m "chore: bump version to 0.2.0"
git push origin main

# 3. Tag and push
git tag -a v0.2.0 -m "Release v0.2.0

Added:
- Feature X

Fixed:
- Bug Y"

git push origin v0.2.0
```

### For Users

1. Go to: https://github.com/sarlalian/scry/releases
2. Download binary for your platform
3. Verify checksum (optional): `sha256sum -c checksums.txt`
4. Make executable (Unix/macOS): `chmod +x scry-*`
5. Run: `./scry-{version}-{platform}-{arch} --help`

## Integration with Existing CI

The release workflow is separate from the existing CI workflow:

- **CI** (`.github/workflows/ci.yml`):
  - Triggers: Push to main, PRs
  - Tests multiple Bun versions (1.1.0, latest)
  - Tests all platforms
  - Uploads dev artifacts

- **Release** (`.github/workflows/release.yml`):
  - Triggers: Version tags (v*.*.*)
  - Uses latest Bun only
  - Cross-compiles for all platforms
  - Creates public releases

They work together:
1. CI validates all commits to main
2. When ready, tag triggers release
3. Release workflow builds production binaries
4. Users download from GitHub Releases

## Testing Strategy

### Pre-Release Testing

Before pushing a tag:

```bash
# Run all checks
bun run check

# Test local build
bun run build:local
./dist/scry --version
./dist/scry me
```

### Post-Release Verification

After workflow completes:

1. Check workflow run: https://github.com/sarlalian/scry/actions
2. Verify release created: https://github.com/sarlalian/scry/releases
3. Download and test binaries:
   ```bash
   # Download
   wget https://github.com/sarlalian/scry/releases/download/v0.2.0/scry-0.2.0-linux-x64

   # Verify checksum
   wget https://github.com/sarlalian/scry/releases/download/v0.2.0/checksums.txt
   sha256sum -c checksums.txt

   # Test binary
   chmod +x scry-0.2.0-linux-x64
   ./scry-0.2.0-linux-x64 --version
   ```

## Future Enhancements

### Planned Improvements

1. **Binary Signing**
   - Code signing for macOS (notarization)
   - Authenticode signing for Windows

2. **Additional Distribution Channels**
   - Homebrew formula auto-update
   - Scoop manifest for Windows
   - AUR package for Arch Linux
   - Docker images

3. **Baseline Builds**
   - Add `-baseline` variants for x64 platforms
   - Support older CPUs without AVX2

4. **Enhanced Testing**
   - Smoke tests for release binaries
   - Integration tests with real Jira instance

5. **Automation**
   - Auto-generate CHANGELOG from commits
   - Auto-bump version in package.json
   - Release announcement bot

6. **Metrics**
   - Download statistics tracking
   - Platform usage analytics

### Not Planned

- ❌ npm package (Scry is a CLI tool, not a library)
- ❌ Windows ARM64 (Bun support pending)
- ❌ 32-bit builds (deprecated architectures)

## Dependencies

### GitHub Actions

- `actions/checkout@v4` - Repository checkout
- `oven-sh/setup-bun@v2` - Bun installation
- `actions/upload-artifact@v4` - Artifact uploads
- `actions/download-artifact@v4` - Artifact downloads
- `softprops/action-gh-release@v2` - Release creation

### Runtime Requirements

- Bun >= 1.1.0 (for cross-compilation)
- Git (for tag operations)
- Platform-specific runners (ubuntu-latest, macos-latest, windows-latest)

## Compliance

### Licenses

- Workflow uses MIT-licensed actions
- Generated binaries inherit project license (MIT)

### Security

- No secrets required (uses GITHUB_TOKEN)
- No external API calls
- No telemetry or tracking

## Monitoring

### View Workflow Runs

https://github.com/sarlalian/scry/actions/workflows/release.yml

### View Releases

https://github.com/sarlalian/scry/releases

### Troubleshooting

Common issues and solutions documented in:
- `docs/release-workflow.md` - User perspective
- `docs/commands/release.md` - Technical details

## References

- [Bun Executables Documentation](https://bun.com/docs/bundler/executables)
- [Bun Cross-Compilation Blog](https://developer.mamezou-tech.com/en/blogs/2024/05/20/bun-cross-compile/)
- [GitHub Actions: Publishing Releases](https://docs.github.com/en/actions/publishing-packages)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

## Success Criteria

All requirements met:

- ✅ Triggers on version tags (v*.*.*)
- ✅ Builds for Linux x64 and ARM64
- ✅ Builds for macOS x64 and ARM64
- ✅ Builds for Windows x64
- ✅ Creates GitHub Release
- ✅ Includes release notes (from tag or CHANGELOG)
- ✅ Attaches all binary artifacts
- ✅ Includes checksums file
- ✅ Uses proper naming: `scry-{version}-{os}-{arch}`
- ✅ Production-ready quality checks
- ✅ Comprehensive documentation

## Conclusion

The release workflow is production-ready and follows GitHub Actions best practices. It provides:

- **Automation**: One command (`git push origin v0.2.0`) triggers complete release
- **Quality**: All tests must pass before release
- **Coverage**: 5 platform/architecture combinations
- **Verification**: SHA-256 checksums for all binaries
- **Documentation**: Comprehensive guides for maintainers and users
- **Extensibility**: Easy to add new platforms or features

The workflow is ready for the first production release.
