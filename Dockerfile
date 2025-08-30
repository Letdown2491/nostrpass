# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Use corepack so pnpm works if your repo uses it
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Install deps
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install; fi

# Build app
COPY . .
RUN if [ -f pnpm-lock.yaml ]; then pnpm exec vite build; \
    elif [ -f package-lock.json ]; then npx vite build; \
    elif [ -f yarn.lock ]; then yarn vite build; \
    else npx vite build; fi

# ---- Runtime stage: static server (no Nginx) ----
FROM node:20-alpine AS runner
RUN npm i -g serve
WORKDIR /app
COPY --from=build /app/dist ./dist

EXPOSE 3000
# `serve -s` enables SPA fallback (index.html for unknown routes)
CMD ["serve", "-s", "dist", "-l", "3000"]
