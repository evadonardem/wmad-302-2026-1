# Development Dockerfile for Expo React Native
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    bash \
    curl \
    python3 \
    make \
    g++ \
    linux-headers \
    libstdc++

# Install Expo CLI and EAS CLI globally
RUN npm install -g expo-cli eas-cli @expo/ngrok

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (clean install from the lockfile; falls back to a
# plain install if package.json was edited without regenerating the lock)
RUN npm ci || npm install --no-audit --no-fund

# Copy the rest of the application
COPY . .

# Expose Expo ports
EXPOSE 8081 8082 8083 19000 19001 19002 19006

# Default command
CMD ["npx", "expo", "start", "--host", "lan", "--clear"]
