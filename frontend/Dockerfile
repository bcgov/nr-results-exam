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

# Copy static files and configuration
COPY --from=build /app/build/ /srv
COPY Caddyfile /etc/caddy/Caddyfile

# CA certs and verify Caddy formatting
RUN apk add --no-cache ca-certificates && \
    caddy fmt --diff /etc/caddy/Caddyfile

# User and port
USER 1001
EXPOSE 3000
