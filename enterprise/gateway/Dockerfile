FROM node:20-alpine

LABEL org.opencontainers.image.source="https://github.com/Odingard/cerberus"
LABEL org.opencontainers.image.description="Cerberus Enterprise Gateway — agentic AI runtime security"
LABEL org.opencontainers.image.licenses="SEE LICENSE IN legal/EULA.md"

WORKDIR /app

# Non-root user for security
RUN addgroup -S cerberus && adduser -S cerberus -G cerberus

# Install dependencies
ENV HUSKY=0 NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy source (enterprise gateway uses local src via relative imports)
COPY src/ ./src/
COPY enterprise/ ./enterprise/
COPY tsconfig.json ./

# Lock down filesystem ownership
RUN chown -R cerberus:cerberus /app

USER cerberus

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["npx", "tsx", "enterprise/gateway/server.ts"]
