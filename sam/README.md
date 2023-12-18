# Morio sam

This is the Morio System Actions Manager, or **sam** for short.  
It is a REST API built with [Express](https://expressjs.com/).

## Getting Started

First of all, since this is a monorepo you should follow the Getting Started
instructions in the README.md file in the root of this repository.

Once that is done, cd into this folder and run the following command to start
the development server:

```
cd api
npm run dev
```

The API will be available at http://localhost:3020

## API Reference

Since this API is internal to Morio, it is not documented with an OpenAPI
specification.  
However, for people interested in working on Morio, below is a list of
endpoints and their descriptions:

### Docker

- **GET** `/docker/list/containers` : Lists (running) Docker containers
- **GET** `/docker/list/all-containers` : Lists all Docker containers
- **GET** `/docker/list/images`: Lists Docker images
- **GET** `/docker/list/networks`: Lists Docker networks
- **GET** `/docker/info`: Lists Docker info
- **GET** `/docker/version`: Lists Docker version

### Status

- **GET** `/status`: Returns SAM status

## Pretty logs

This uses the pino logging library, which will output JSON lines. To make
those a bit nicer to read in your terminal, you should first install
pino-pretty:

```
npm install --global pino-pretty
```

Then pipe the output of the development server into pino-pretty:

```
npm run dev | pino-pretty
```
