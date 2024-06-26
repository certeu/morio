# Morio Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## Changed

- [broker] Upgraded RedPanda Broker from 23.3.4 to 23.3.15
- [ca] Upgraded SmallStep CA from 0.25.2 to 0.26.1
- [connector] Upgraded Elastic Logstash from 8.12.1 to 8.13.3
- [console] Upgraded RedPanda Console from 2.4.0 to 2.5.2
- [proxy] Upgraded Traefik Application Proxy from 2.10.7 to 2.11.2

## [0.2.2] - 2014-05-07

# Added

- [api] Start ephemeral LDAP instance for running tests
- [api] Added reconfigure route
- [api] Allow access to test coverage reports when not in production
- [api] Added middleware to guard routes in ephemeral mode
- [api] Add curl to dev container image
- [api] Guard routes while reconfiguring
- [core] Guard routes while reconfiguring
- [core] Setup unit testing for core
- [core] Added middleware to guard routes in ephemeral mode
- [core] Added endpoint to remove Docker network
- [core] On startup, core now creates and attaches to its own Docker network, and then disconnects from all other networks
- [core] Add curl to dev container image
- [core] Carve out exception to not restart API during tests
- [db] Added database service, using Rqlite as database

## Changed

- [api] Do not attempt to authenticate in ephemeral mode
- [api] Removed core routes that we do not want to expose
- [core] Expose port when not in prod to allow serving coverage report
- [core] Unused docker routes were removed
- [proxy] Set alias in dev for unit tests

### Fixed

- [api] Prevent RPKV lookups from hanging when there is no data
- [api] Do not attempt to load config from core in ephemeral mode
- [api] Fix loading of info from core in ephemeral mode
- [api] Handle empty cookie in authentication route
- [core] /jwks endpoint in ephemeral mode
- [core] Typo in returned body
- [ui] MRT login was sending incorrect data
- [ui] Add to npm workspace configuration

## [0.1.6] - 2014-04-22

# Added

- [api] Added `/whoami` route
- [api] Added `/jwks` route
- [core] Added support for the db service
- [core] Added `/jwks` route
- [core] Generate node and deployment UUID
- [core] Return UUIDS after setup
- [core] Added support for setting aliases on containers

## Changed

- [api] Migrated accounts and apikeys from rpkv to db
- [client] No pager when invoking systemctl
- [core] Dropped BSON dependency
- [core] Changes to the connector config generators
- [connector] Changes to the connector configuration
- [ui] Logout user when in ephemeral mode
- [ui] Redirect user when in ephemeral mode on a non-ephemeral URL
- [ui] Changes to connector pipelines for Elasticsearch

### Fixed

- [api] Only allow specific routes in epehemeral mode
- [connector] Make sure pipelines.yml exists prior to mount
- [moriod] Move env files into correct location
- [ui] Fix index input in Elasticsearch pipeline output form
- [ui] Login form when only MRT is available
- [ui] Always redirect to home page in epehemeral mode

### Removed

- [api] Dropped rpkv functionality in favor of the new database service
- [core] Dropped creation of KV topics in favor of the new database service

## [0.1.5] - 2014-04-16

### Added

- [api] Allow downloads from downloads folder
- [config] Added `MORIO_DOWNLOADS_FOLDER` preset defaulting to downloads
- [core] Store root and intermediate CA certificates in downloads/certs folder
- [core] Store broker certificate in downloads/certs folder
- [core] Keep both CA root and intermediate certificates in the store
- [ui] Add download links for root, intermediate, and broker certs to certificates page

### Changed

- Download folder was changed from `tmp_static` to `downloads` and is configurable via preset now
- Update export Docker images script to use new downloads location
- [api] Do not include API prefix when enumerating downloads
- [clients] Changes to client config
- [ui] Do not include API prefix when client package downloads
- [ui] Split create/download certificates into different pages

### Fixed

- [api] Do not check for `MORIO_REPO_ROOT` in production
- [clients] Enabled inputs for filebeat
- [core] Write client ad-hoc config to source files, not destination
- [core] Configure TLS chain on Kafka API port, rather than only the leaf certificate
- [core] Fix incorrect passing of hookProps to lifecycle hook
- [core] Conditionally check hookprops rather than assume they are set
- [core] Fix location of client source files inside container

## [0.1.4] - 2014-04-12

### Added

- [clients] Added logs config folders for linux client
- [moriod] Install revision file with package
- [moriod] Add systemd as a dependency in .deb control file

### Changed

- [api] Changed prefix to -/api from ops/api
- [broker] Check CA status rather than wait an arbitrary time for it to come up
- [core] Add hookProps to reconfigure for informed choices
- [core] Moved config and data into moriod subfolder on host OS
- [moriod] Updates to folder locations
- [proxy] Include custom entrypoint.sh in moriod package

### Dependencies

- Dropped chai, chai-http, and mocha dependencies in favor of a future test container image
- Dropped pino-pretty as a dev dependency
- Hoisted esbuild, eslint, lint-staged, and prettier dev dependencies to the repo root
- Updated esbuild from `^0.19.9` to `^0.20.2`
- Updated eslint-plugin-react from `^7.33.2` to `^7.34.1`
- Updated husky from `^8.0.0` to `^9.0.11`
- Updated lint-staged from `^15.2.0` to `^15.2.2`
- Updated prettier from `^3.1.1` to `^3.3.0`
- [api] Updated axios from `^1.6.3` to `^1.6.8`
- [api] Updated bson from `^6.4.0"` to `^6.6.0"`
- [api] Updated express from `^4.18.2` to `^4.19.2`
- [api] Updated glob from `^10.3.10` to `^10.3.12`
- [api] Updated joi from `^17.11.0` to `^17.12.3`
- [api] Updated pino from `^8.16.2` to `^8.20.0`
- [api] Updated nodemon from `^3.0.2` to `^3.1.0`
- [core] Updated axios from `^1.6.7` to `^1.6.8`
- [core] Updated bson from `^6.4.0"` to `^6.6.0"`
- [core] Updated dockerode from `^4.0.0` to `^4.0.2`
- [core] Updated express from `^4.18.2` to `^4.19.2`
- [core] Updated joi from `^17.11.0` to `^17.12.3`
- [core] Updated pino from `^8.16.2` to `^8.20.0`
- [shared] Updated bson from `^6.2.0"` to `^6.6.0"`
- [shared] Updated glob from `^10.3.10` to `^10.3.12`
- [ui] Updated @mdx-js/loader from `^3.0.0` to `^3.0.1`
- [ui] Updated @mdx-js/react from `^3.0.0` to `^3.0.1`
- [ui] Updated @next/mdx from `^14.1.0` to `^14.2.0`
- [ui] Updated @types/mdx from `^2.0.11` to `^2.0.13`
- [ui] Updated diff from `^5,1,0` to `^5.2.0`
- [ui] Updated joi from `^17.11.0` to `^17.12.3`
- [ui] Updated jotai from `^2.6.0` to `^2.8.0`
- [ui] Updated jotai-location from `^0.5.2` to `^0.5.4`
- [ui] Updated next from `14.0.3` to `^14.2.0`
- [ui] Updated react-cookie from ``^7.1.0 to `^7.1.4`
- [ui] Updated react-diff-viewer-continued from `^3.2.5` to `^3.4.0`
- [ui] Updated recma-export-filepath from ``^1.0.0 to `^1.1.0`
- [ui] Updated use-local-storage-state from ``^19.1.0 to `^19.2.0`
- [ui] Updated yaml from `^2.3.4` to `^2.4.1`
- [ui] Updated autoprefixer from `^10.0.1` to `^10.4.19`
- [ui] Updated daisyui from `^4.4.18` to `^4.10.1`
- [ui] Updated lint-staged from `^15.2.0` to `^15.2.2`
- [ui] Updated tailwindcss from `^3.3.0` to `^3.4.3`
- [ui] Updated yaml-loader from `^0.8.0` to `^0.8.1`

### Fixed

- [broker] Fixed volume config when in develop mode
- [ca] Fixed volume config when in develop mode
- [core] Wait just a smidge before requesting CA certificate to avoid JWT timestamps that predate the CA epoch
- [core] Always recreate containers who need TLS on initial deploy
- [core] Keep auto-generated files out of config image
- [dbuilder] Fixed volume config when in develop mode
- [shared] Pass options to NodeJS cp call
- [moriod] Create version.env file on reconfigure inside repo
- [ui] Fix hardcoded API prefix

### Removed

- [client] Remove option to add Elastic repo as it's a requirement for installation
- [shared] Removed getRevision and verion epoch

## [0.1.3] - 2014-04-09

### Added

- [clients] Extended auditing for Linux client
- [moriod] Extended command line options
- [shared] The cp method now accepts options to pass to the NodeJS fs.cp call

### Changed

- [core] Use the journald Docker log driver for all morio containers
- [core] Use the current Morio version as default version for the .deb client package
- [core] Pass all props to lifecycle hooks as one object
- [core] Reorder Dockerfile layers to improve cache hits
- [moriod] Add postinstall script to start/enable services
- [ui] Renamed PreHeader to BannerMessage as it's a more descriptive name

### Fixed

- [core] Fix check for missing config file at first start of the CA service
- [core] Fix location of dbuilder control file output
- [core] Include client files in core container so it can pass them to the builder
- [ui] Fix broken link to downloads page in .deb builder output
- [ui] Ensure input background respects light/dark color scheme

## [0.1.2] - 2024-04-03

### Added

- This is the first Morio version where we included a changelog
- Changes will be tracked from this version onwards
