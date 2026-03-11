FROM node:20-slim

# Build tools required for better-sqlite3 native module
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first — layer is cached unless package.json changes
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source
COPY src/ ./src/
COPY playground/ ./playground/

CMD ["npx", "tsx", "playground/src/server.ts"]
