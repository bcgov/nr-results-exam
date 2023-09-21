# Build static files
# Node Bullseye has npm
FROM node:20.7.0-bullseye-slim AS build
ENV NODE_ENV production

# Copy and build
WORKDIR /app
COPY . .
RUN npm i -g nodemon && \
    npm i --ignore-scripts --no-update-notifer --omit=dev

# Ports, health check and non-root user
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:5000 || exit 1
# USER 1001

# Start up command with 50MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["npm", "start", "--max-old-space-size=50"]
