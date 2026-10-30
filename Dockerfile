FROM node:26-trixie-slim AS build
WORKDIR /action
COPY package.json package-lock.json .npmrc tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:26-trixie-slim
LABEL authors="aal"
# Shared location for the Playwright browser, so the node user can use what root installs
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /action

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        rsync \
        openssh-client \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev \
    && npx playwright install --with-deps --only-shell chromium \
    && rm -rf /var/lib/apt/lists/* /root/.npm
COPY --from=build /action/dist ./dist

USER node

ENTRYPOINT ["node", "/action/dist/index.mjs"]
