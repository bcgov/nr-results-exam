# Build
FROM node:alpine AS build

# Copy and build
WORKDIR /app
COPY . .
RUN apk add --no-cache python3 g++ make
RUN npm install -g nodemon  # Install nodemon globally
RUN npm install


# User and startup
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:5000

#CMD
CMD ["npm", "start"]