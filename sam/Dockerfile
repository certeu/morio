## Stage 1: Builder
FROM node:alpine as builder

## Set workdir
WORKDIR /morio/sam

## Install node dependencies
COPY package* ./
RUN npm install pm2
RUN npm ci

## Build app
COPY build.mjs build.mjs
COPY src src
COPY shared shared
COPY defaults defaults

## Stage 2: App
FROM node:alpine as app

## Set workdir
WORKDIR /morio/sam

## Copy built node modules and binaries without including the toolchain
COPY --from=builder /morio/sam/node_modules/ /morio/sam/node_modules/
COPY --from=builder /morio/sam/src/ /morio/sam/src/
COPY --from=builder /morio/sam/shared/ /morio/sam/shared/
COPY --from=builder /morio/sam/defaults/ /morio/sam/defaults/
COPY --from=builder /morio/sam/package.json /morio/sam/package.json

## Add a user to run the app
RUN addgroup -S morio \
  && adduser -S morio \
  && chown -R morio /morio

## Drop privleges and run app
USER morio
CMD ["./node_modules/.bin/pm2-runtime",  "./src/index.mjs"]
