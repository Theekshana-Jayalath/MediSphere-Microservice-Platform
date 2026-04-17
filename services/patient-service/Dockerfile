FROM node:20-alpine AS builder

WORKDIR /app

# copy package.json (no lockfile in repo) and install dev deps as needed
COPY package.json ./
RUN npm install --production=false

# copy source
COPY . .

# create uploads directories during build so they exist at runtime
RUN mkdir -p uploads src/uploads

FROM node:20-alpine
WORKDIR /app

# copy node_modules and source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 5005

# run as non-root user
USER node

CMD ["node", "src/server.js"]