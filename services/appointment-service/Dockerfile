FROM node:20-alpine AS builder

WORKDIR /app

# install dependencies (lockfile present)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# copy source
COPY . .

FROM node:20-alpine
WORKDIR /app

# copy only runtime deps and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 5003

# run as non-root for safety
USER node

CMD ["node", "server.js"]