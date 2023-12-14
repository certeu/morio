# Morio SAM

This is Morio's System Actions Manager, or SAM.

It is responsible for managing local system action, which typically means
starting, stopping, creating, or configuring Docker containers.

It listens for requests on HTTP but is only accessible via the internal Docker network.
It it, in others words, not a user-facing Morio service but rather an internal service.

In a stand-alone setup, it is the API that talks to SAM directly.
In a clustered setup, the API will talk to DEAN who will distribute the action to all cluster members, with the help of ETCD.

> _Note that none of this is implemented at this point, but this is the initial idea_

## Local development

To run SAM locally, first install dependencies:

```
npm install
```

Then start SAM in development mode:

```
npm run dev
```

## Pretty logs

This uses the pino logging library, which will output JSON lines.
To make those a bit nicer to read in your terminal, you should first install pino-pretty:

```
npm install --global pino-pretty
```

Then pipe the output into :

```
npm run dev | pino-pretty
```
