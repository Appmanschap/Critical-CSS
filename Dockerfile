FROM node:lts-alpine3.19
LABEL authors="aal"

COPY package.json .
COPY src ./src
RUN apk --no-cache add rsync \
    && npm i

ENTRYPOINT ["node", "/src/index.js"]