# Build static files
# Node Bullseye has npm
FROM node:20.8.0-bullseye-slim AS build
ENV NODE_ENV production

# Copy and build
WORKDIR /app
COPY . .
RUN npm i --ignore-scripts --no-update-notifer --omit=dev


# Deploy container
# Distroless has node, but not npm
FROM gcr.io/distroless/nodejs20-debian11:nonroot AS deploy
ENV NODE_ENV production

# Copy over app
WORKDIR /app
COPY --from=build /app ./

# Ports, health check and non-root user
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:5000 || exit 1

# Start up command with 50MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=50", "/app/index"]
