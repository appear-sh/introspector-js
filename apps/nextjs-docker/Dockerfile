FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy app build artifacts
COPY .next .next
COPY node_modules ./node_modules
# COPY public ./public
COPY package.json package.json
# COPY .env .env

# Expose port to App Runner / ECS
EXPOSE $PORT

# Run Next.js server
CMD ["npx", "next", "start", "--port", "3000", "--hostname", "0.0.0.0"]