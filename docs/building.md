# Building Scry

This guide explains how to build Scry binaries for various platforms.

## Prerequisites

- [Bun](https://bun.sh) >= 1.1.0

## Build Commands

### Local Build

Build a binary for your current platform:

```bash
bun run build:local
```

This creates `dist/scry` (or `dist/scry.exe` on Windows).

### Platform-Specific Builds

Build for individual platforms:

```bash
bun run build:linux-x64       # Linux x86-64
bun run build:linux-arm64     # Linux ARM64
bun run build:darwin-x64      # macOS Intel
bun run build:darwin-arm64    # macOS Apple Silicon
bun run build:windows-x64     # Windows x86-64
```

### Build All Platforms

Build binaries for all supported platforms:

```bash
bun run build:all
```

Or simply:

```bash
bun run build
```

This cleans the `dist/` directory and builds all five platform binaries:

- `dist/scry-linux-x64`
- `dist/scry-linux-arm64`
- `dist/scry-darwin-x64`
- `dist/scry-darwin-arm64`
- `dist/scry-windows-x64.exe`

## Binary Sizes

Typical binary sizes:

- **macOS ARM64**: ~59 MB
- **macOS x64**: ~65 MB
- **Linux ARM64**: ~95 MB
- **Linux x64**: ~102 MB
- **Windows x64**: ~116 MB

## How It Works

Bun's `--compile` flag creates standalone executables that bundle:

- The Bun runtime
- Your TypeScript/JavaScript code
- All dependencies from `node_modules`

The resulting binaries are self-contained and don't require Node.js, Bun, or any dependencies to be installed on the target system.

### Cross-Compilation

Bun supports cross-compilation, meaning you can build binaries for other platforms from your development machine. For example, you can build Linux and Windows binaries from macOS.

On the first build for a new platform, Bun automatically downloads the required runtime for that platform. Subsequent builds reuse the cached runtime.

## Testing Binaries

Test a local binary:

```bash
./dist/scry --version
./dist/scry --help
```

On macOS, you may need to remove the quarantine attribute from downloaded binaries:

```bash
xattr -d com.apple.quarantine dist/scry-darwin-arm64
```

## Distribution

For release distribution:

1. Build all platform binaries: `bun run build:all`
2. Create platform-specific archives (`.tar.gz` for Unix, `.zip` for Windows)
3. Upload to GitHub Releases or your distribution channel

## Cleaning

Remove all built binaries:

```bash
bun run clean
```

This removes the entire `dist/` directory.

## Troubleshooting

### Permission Denied

If you get "permission denied" when running a binary:

```bash
chmod +x dist/scry-linux-x64
```

### Binary Size

The binaries are relatively large because they include the entire Bun runtime. This is a trade-off for portability - users don't need to install anything to run Scry.

If size is a concern, consider:
- Compressing binaries for distribution (they compress well)
- Providing installation via package managers (npm, brew, etc.) for users who already have a runtime

### Build Failures

If a build fails:

1. Ensure you have the latest version of Bun: `bun upgrade`
2. Clean and rebuild: `bun run clean && bun run build:all`
3. Check that you have sufficient disk space (builds can use 500+ MB)
