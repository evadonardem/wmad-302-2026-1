FROM node:alpine
WORKDIR /app
RUN mkdir -p /app/node_modules && chown node:node /app/node_modules
COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci \
    --fetch-retries=5 \
    --fetch-retry-factor=2 \
    --fetch-retry-mintimeout=10000 \
    --fetch-retry-maxtimeout=120000
EXPOSE 8081
