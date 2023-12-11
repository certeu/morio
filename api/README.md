# Morio API

This is the morio REST API.

## Local development

To run it locally, first install dependencies:

```
npm install
```

Then start the API in development mode:

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
