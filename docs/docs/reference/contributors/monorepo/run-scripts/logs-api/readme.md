--- 
title: logs:api
---

The `logs:api` _run script_ tails the Docker logs of the _api service_,
and pipes them into [pino-pretty](https://www.npmjs.com/package/pino-pretty).

Run `npm run logs:api` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
docker logs -n 20 -f api | pino-pretty -i pid,time,name,hostname
```

## Prerequisites

This relies on the [pino-pretty](https://www.npmjs.com/package/pino-pretty) NPM package being available.

You can install it globally with:

```sh title="Terminal"
npm install --global pino-pretty
```
