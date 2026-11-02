FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY frontend ./frontend
COPY backend ./backend
COPY scripts/build.mjs ./scripts/build.mjs
RUN node scripts/build.mjs
ENV HOST=0.0.0.0 PORT=3000 DATA_DIR=/app/data
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node","backend/server.mjs"]
