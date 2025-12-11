## Use this section once builds are fixed

FROM node:24.11.1-bookworm-slim AS build

# Build static files
WORKDIR /app
COPY . .

RUN npm ci --ignore-scripts && \
    npm run build && \
    rm -rf node_modules

# Build custom Caddy with Coraza WAF plugin
FROM caddy:2.10.2-builder AS builder
# Install CA certificates for Go module downloads
RUN apk add --no-cache ca-certificates
# Build Caddy with Coraza WAF plugin
# Note: Using /v2 module path (latest v2 branch). For reproducible builds, consider pinning to a specific version tag:
# --with github.com/corazawaf/coraza-caddy/v2@v2.x.x
RUN xcaddy build \
    --with github.com/corazawaf/coraza-caddy/v2@v2.8.1

# Deploy using custom Caddy to host static files
FROM caddy:2.10.2-alpine
ENV LOG_LEVEL=info

# Copy custom Caddy binary with Coraza
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

# Copy static files, Coraza config, verify Caddyfile formatting
COPY --from=build /app/build/ /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY coraza.conf /etc/caddy/coraza.conf

# Create directories for Coraza WAF with OpenShift-compatible permissions
# OpenShift uses random UIDs, so use 777 permissions for /tmp (standard for temporary directories)
# This ensures any UID can write to the directory regardless of ownership
RUN mkdir -p /tmp/coraza && \
    chmod -R 777 /tmp/coraza

# CA certs and verify Caddy formatting
RUN apk add --no-cache ca-certificates && \
    caddy fmt --diff /etc/caddy/Caddyfile

# User and port
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c "/bin/busybox wget -qO- http://127.0.0.1:3000/ >/dev/null"
