# Scry - Jira CLI
# Run `just` to see available recipes

# Default recipe - show help
default:
    @just --list

# Install dependencies
install:
    bun install

# Run the CLI in development mode
run *ARGS:
    bun run src/index.ts {{ARGS}}

# Run with hot reloading (for development)
dev *ARGS:
    bun --hot run src/index.ts {{ARGS}}

# Run tests
test *ARGS:
    bun test {{ARGS}}

# Run tests in watch mode
test-watch:
    bun test --watch

# Run tests with coverage
test-coverage:
    bun test --coverage

# Type check
typecheck:
    bun run typecheck

# Lint code
lint:
    bun run lint

# Lint and fix
lint-fix:
    bun run lint:fix

# Lint code (alias)
l: lint

# Format code
format:
    bun run format

# Run all checks (typecheck, lint, test)
check: typecheck lint test

# Build local binary
build:
    bun build --compile --outfile dist/scry src/index.ts

# Build cross-platform binaries
build-all:
    bun run build

# Clean build artifacts
clean:
    rm -rf dist

# Initialize scry configuration
init:
    bun run src/index.ts init

# Show current user (test auth)
me:
    bun run src/index.ts me

# List issues (optionally pass JQL or filters)
issues *ARGS:
    bun run src/index.ts issue list {{ARGS}}

# View an issue
issue KEY:
    bun run src/index.ts issue view {{KEY}}

# Show help for a command
help CMD="":
    @if [ -z "{{CMD}}" ]; then \
        bun run src/index.ts --help; \
    else \
        bun run src/index.ts {{CMD}} --help; \
    fi

# Watch for changes and run tests
watch:
    bun test --watch

# Create a new release (builds all platforms)
release VERSION:
    @echo "Building release {{VERSION}}..."
    VERSION={{VERSION}} bun run build
    @echo "Release {{VERSION}} built successfully!"

# Run with a specific config file
with-config CONFIG *ARGS:
    SCRY_CONFIG_FILE={{CONFIG}} bun run src/index.ts {{ARGS}}

# Run with test config (expects .scry-test.yml or set SCRY_TEST_CONFIG)
test-jira *ARGS:
    SCRY_CONFIG_FILE=${SCRY_TEST_CONFIG:-.scry-test.yml} bun run src/index.ts {{ARGS}}

# Show which config file would be used
which-config:
    @echo "Config search order:"
    @echo "  1. -c/--config flag"
    @echo "  2. SCRY_CONFIG_FILE env var: ${SCRY_CONFIG_FILE:-<not set>}"
    @echo "  3. .scry.yml (in current directory)"
    @echo "  4. ~/.config/scry/config.yml"
    @echo "  5. ~/.scry.yml"
    @echo ""
    @if [ -n "${SCRY_CONFIG_FILE:-}" ] && [ -f "${SCRY_CONFIG_FILE}" ]; then \
        echo "Would use: ${SCRY_CONFIG_FILE}"; \
    elif [ -f ".scry.yml" ]; then \
        echo "Would use: .scry.yml"; \
    elif [ -f "${HOME}/.config/scry/config.yml" ]; then \
        echo "Would use: ${HOME}/.config/scry/config.yml"; \
    elif [ -f "${HOME}/.scry.yml" ]; then \
        echo "Would use: ${HOME}/.scry.yml"; \
    else \
        echo "No config file found!"; \
    fi

# Show project stats
stats:
    @echo "Lines of code:"
    @find src -name "*.ts" | xargs wc -l | tail -1
    @echo ""
    @echo "Test count:"
    @bun test 2>&1 | grep -E "^\s*\d+ pass" || true
    @echo ""
    @echo "Dependencies:"
    @jq -r '.dependencies | keys | length' package.json | xargs printf "  Production: %s\n"
    @jq -r '.devDependencies | keys | length' package.json | xargs printf "  Development: %s\n"
