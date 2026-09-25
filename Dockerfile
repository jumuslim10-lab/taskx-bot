# Dockerfile for Railway deployment
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Expose port (if needed)
EXPOSE 3000

# Start the bot
CMD ["node", "main-bot.js"]
