## Differences between development and production builds

This applies to the containers we build ourselves, not the ones we use as-is from upstream.

### Container contents

- Development builds map the local source code in the container so you can make
  changes to the code running within without having to enter the container
- Production builds bundle the source code inside the container

### Container entrypoint

- Development builds running NodeJS (api, core, ui) willrun in _development mode_ where they automatically reload when changes are detected (using [nodemon](https://www.npmjs.com/package/nodemon))
- Production containers use [the PM2 process manager](https://pm2.keymetrics.io/) to run the NodeJS code

### Run script prefix

- Development builds are triggered with run scripts with the `build:` prefix
- Production builds are triggered with run scripts with the `ci:` prefix (as they are intended to run in _CI_)

### Container namespace

- Development builds use the `morio` namespace (which cannot be published on Dockerhub)
- Production builds use the `itsmorio` namespace

### Builder

- Development builds are built using Docker's own BuildKit
- Production builds are built using [Buildah](https://buildah.io/) as this avoids the need to access the Docker socket, which is often impossible in a _CI_ environment.
