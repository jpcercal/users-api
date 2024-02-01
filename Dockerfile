FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build production release
RUN npm run build:release

# Install production dependencies
RUN rm -Rf node_modules && npm install --production --ignore-scripts

# Prduction image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /usr/src/app

# Create app directory
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/openapi.yaml ./openapi.yaml

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PATH=/usr/src/app/node_modules/.bin:$PATH
ENV PORT=3000

# Start
CMD ["node", "dist/src/main.js"]
