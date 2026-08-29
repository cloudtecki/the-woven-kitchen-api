# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (cached separately from source)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies for production image
RUN npm prune --omit=dev

# ---- Production stage ----
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Copy production dependencies and build output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
