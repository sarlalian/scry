# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build standalone binary for smaller final image
RUN bun build --compile --minify --outfile /app/scry src/index.ts

# Runtime stage - use distroless for minimal attack surface
FROM gcr.io/distroless/cc-debian12

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /app/scry /usr/local/bin/scry

# Set environment variable defaults
ENV SCRY_AUTH_TYPE=basic

ENTRYPOINT ["scry"]
