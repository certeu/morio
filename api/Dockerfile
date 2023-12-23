## Stage 1: Builder
FROM node:alpine as builder

## Set workdir
WORKDIR /morio/api

## Install node dependencies
COPY package* ./
RUN npm install pm2
RUN npm ci

## Build app
COPY build.mjs build.mjs
COPY src src
COPY openapi openapi
COPY shared shared
COPY defaults defaults
RUN npm run build
COPY dist dist

## Stage 2: App
FROM node:alpine as app

## Set workdir
WORKDIR /morio/api

## Copy built node modules and binaries without including the toolchain
COPY --from=builder /morio/api/node_modules/ /morio/api/node_modules/
COPY --from=builder /morio/api/dist/ /morio/api/dist/
COPY --from=builder /morio/api/package.json /morio/api/pacakage.json

## Add a user to run the app
RUN addgroup -S morio \
  && adduser -S morio \
  && chown -R morio /morio

## Drop privleges and run app
USER morio
CMD ["./node_modules/.bin/pm2-runtime",  "./dist/index.mjs"]
