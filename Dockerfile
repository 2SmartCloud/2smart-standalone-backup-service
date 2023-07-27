
FROM docker/compose AS docker-stage
FROM node:12.5-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh tzdata tar py-pip python-dev libffi-dev openssl-dev gcc libc-dev make

COPY --from=docker-stage /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker-stage /usr/local/bin/docker-compose /usr/local/bin/docker-compose

WORKDIR /app

COPY etc etc
COPY lib lib
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY app.js app.js
COPY .env.defaults .env.defaults

# solution for core-js postinstall script hang up
# https://github.com/zloirock/core-js/issues/673#issuecomment-550199917
RUN npm config set unsafe-perm true
RUN npm i --production

CMD npm start