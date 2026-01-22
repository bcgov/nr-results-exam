# Build static files
# Node Bookworm has npm
FROM node:24.13.0-bookworm-slim AS build
ENV NODE_ENV=production

# Copy and build
WORKDIR /app
COPY . .
RUN npm i --ignore-scripts --no-update-notifier --omit=dev


# Deploy container
# Distroless has node, but not npm
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS deploy
ENV NODE_ENV=production

# Copy over app
WORKDIR /app
COPY --from=build /app ./

# Ports, health check and non-root user
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["node", "-e", "const http=require('http');const req=http.get({hostname:'127.0.0.1',port:5000,path:'/health'},res=>{process.exit(res.statusCode===200?0:1);});req.on('error',()=>process.exit(1));"]
USER app

# Start up command with 50MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=50", "/app/index"]
