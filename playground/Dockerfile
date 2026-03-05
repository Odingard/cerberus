FROM node:20-alpine
WORKDIR /app
ENV HUSKY=0
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4040
CMD ["npx", "tsx", "playground/src/server.ts"]
