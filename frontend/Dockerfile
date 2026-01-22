# Build static files
FROM node:24.13.0-bookworm-slim AS build

WORKDIR /app
COPY . .

RUN npm ci --ignore-scripts && \
    npm run build && \
    rm -rf node_modules

# Build custom Caddy with Coraza WAF plugin
FROM caddy:2.10.2-builder AS xcaddy
RUN apk add --no-cache ca-certificates
RUN xcaddy build \
    --with github.com/corazawaf/coraza-caddy/v2

# Deploy using custom Caddy to host static files
FROM caddy:2.10.2-alpine
ENV LOG_LEVEL=info

COPY --from=xcaddy /usr/bin/caddy /usr/bin/caddy
COPY --from=build /app/build/ /srv
COPY Caddyfile coraza.conf /etc/caddy/

# Verify Caddy formatting, install CA certs, create Coraza dir with proper permissions
RUN caddy fmt --diff /etc/caddy/Caddyfile && \
    apk add --no-cache ca-certificates && \
    mkdir -p /tmp/coraza && \
    chown 1001:1001 /tmp/coraza

# User, port, healthcheck
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c "/bin/busybox wget -qO- http://127.0.0.1:3000/ >/dev/null"
