# Stage 1: build
FROM node:22.12-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:22-alpine AS release
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
ENV NODE_ENV=production
RUN npm ci --ignore-scripts --omit-dev
EXPOSE 8080
# Serve SSE on /sse using the port Render provides
ENTRYPOINT ["node","shim.js"]
