FROM node:lts-alpine3.19
LABEL authors="aal"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

COPY package.json .
COPY src ./src
RUN apk --no-cache add  \
    rsync \
    openssh \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && npm i \
    && mkdir -p /root/.ssh/

COPY ssh-config /root/.ssh/config
RUN chmod 600 /root/.ssh/config

ENTRYPOINT ["node", "/src/index.js"]