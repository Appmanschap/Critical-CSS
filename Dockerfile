FROM node:lts-alpine3.19
LABEL authors="aal"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN apk --no-cache add  \
    rsync \
    openssh-client \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    sudo

RUN mkdir -p /etc/sudoers.d \
        && echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node \
        && chmod 0440 /etc/sudoers.d/node

RUN mkdir -p /home/node/.ssh/
COPY package.json .
COPY dist ./dist
COPY ssh-config /home/node/.ssh/config

RUN chmod 600 /home/node/.ssh/config && chown -R node.node /home/node

RUN npm i --omit=dev
USER node

ENTRYPOINT ["node", "/dist/index.js"]