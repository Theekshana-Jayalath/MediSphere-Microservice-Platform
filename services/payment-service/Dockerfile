FROM node:20-alpine AS builder

WORKDIR /app

# copy package files and install (no lockfile present)
COPY package.json ./
RUN npm install --production=false

# copy source
COPY . .

FROM node:20-alpine
WORKDIR /app

# copy node_modules and source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 5003

# run as non-root
USER node

CMD ["node", "server.js"]