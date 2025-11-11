## Build stage
FROM node:20.19.5-bullseye-slim AS build

# Build static files and health server
WORKDIR /app
COPY . .

RUN npm ci --ignore-scripts && \
    npm run build && \
    rm -rf node_modules

# Caddy stage
FROM caddy:2.10.2-alpine
ENV LOG_LEVEL=info

# Install Node.js for health server
RUN apk add --no-cache nodejs ca-certificates

# Copy static files, health server, config, and startup script
COPY --from=build /app/build/ /app/build/
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /start.sh

# Make startup script executable and format Caddyfile
RUN chmod +x /start.sh && \
    caddy fmt --overwrite /etc/caddy/Caddyfile

# User, port and healthcheck
USER 1001
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://localhost:3001/health/live || exit 1

# Use startup script to run both services
CMD ["/start.sh"]

