## Use this section once builds are fixed

FROM node:20.19.5-bullseye-slim AS build

# Build static files
WORKDIR /app
COPY . .

RUN npm ci --ignore-scripts && \
    npm run build && \
    rm -rf node_modules

# Caddy
FROM caddy:2.10.2-alpine
ENV LOG_LEVEL=info

# Copy static files, config and readiness check script
COPY --from=build /app/build/ /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY readiness_check.sh /usr/local/bin/readiness_check.sh

# CA certs and verify Caddy formating
RUN apk add --no-cache ca-certificates && \
    caddy fmt --diff /etc/caddy/Caddyfile

# User, port and healthcheck
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s CMD sh /usr/local/bin/readiness_check.sh
