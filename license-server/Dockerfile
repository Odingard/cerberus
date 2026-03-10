FROM node:20-alpine

WORKDIR /app

RUN addgroup -S cerberus && adduser -S cerberus -G cerberus

ENV HUSKY=0 NODE_ENV=production
COPY package*.json ./
RUN npm ci

COPY src/ ./src/

RUN chown -R cerberus:cerberus /app

USER cerberus

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["npx", "tsx", "src/server.ts"]
