--- 
title: dev
---

The `dev` _run script_ starts a Morio development enviroment.
Specifically, it will start the development version of the _core service_
container, making sure to properly map the local source code to the container.

Since this will attempt to launch the development container, you must first run
`npm run build` to  build those container images (See:
[build](/docs/reference/contributors/monorepo/run-scripts/build)).

Then, run `npm run dev` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./core/run-dev-container.sh
```


