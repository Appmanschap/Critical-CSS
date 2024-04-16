FROM node:lts-alpine3.19
LABEL authors="aal"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

COPY package.json .
COPY src ./src
RUN apk --no-cache add  \
    rsync \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && npm i

ENTRYPOINT ["node", "/src/index.js"]