# Morio Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [Unreleased]

### Added

- [moriod] Install revision file with package
- [moriod] Add systemd as a dependency in .deb control file

### Removed

- [client] Remove option to add Elastic repo as it's a requirement for installation

## [0.1.3] - 2014-04-09

### Added

- [moriod] Extended command line options
- [clients] Extended auditing for Linux client
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

