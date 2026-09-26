FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN if [ -f package.json ]; then npm install; fi
EXPOSE 5173
CMD ["npm", "run", "dev"]
