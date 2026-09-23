FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY shared ./shared
COPY public ./public
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/app/data/matchday.sqlite
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
RUN mkdir -p /app/data && chown -R node:node /app
COPY docker-entrypoint.sh /usr/local/bin/matchday-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/matchday-entrypoint && chmod +x /usr/local/bin/matchday-entrypoint
ENTRYPOINT ["matchday-entrypoint"]
EXPOSE 3000
CMD ["node","server/index.js","--production"]
