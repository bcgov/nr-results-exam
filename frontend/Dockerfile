# Build static files
FROM node:24.11.1-bookworm-slim AS build

WORKDIR /app
COPY . .

RUN npm ci --ignore-scripts && \
    npm run build && \
    rm -rf node_modules

# Build custom Caddy with Coraza WAF plugin
FROM caddy:2.10.2-builder AS xcaddy
RUN apk add --no-cache ca-certificates
RUN xcaddy build \
    --with github.com/corazawaf/coraza-caddy/v2@v2.8.1

# Deploy using custom Caddy to host static files
FROM caddy:2.10.2-alpine
ENV LOG_LEVEL=info

COPY --from=xcaddy /usr/bin/caddy /usr/bin/caddy
COPY --from=build /app/build/ /srv
COPY Caddyfile coraza.conf /etc/caddy/

# Create directory for Coraza WAF temporary files
# Coraza requires SecTmpDir and SecDataDir to exist (configured in coraza.conf)
RUN mkdir -p /tmp/coraza

# CA certs and verify Caddy formatting
RUN apk add --no-cache ca-certificates && \
    caddy fmt --diff /etc/caddy/Caddyfile

# User and port
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c "/bin/busybox wget -qO- http://127.0.0.1:3000/ >/dev/null"
