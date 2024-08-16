--- 
title: test:api
--- 

The `test:api` _run script_ runs unit tests on the _api service_.

Run `npm run test:api` in the _monorepo_ root to trigger this script.

<Fixme>
#### YYMV
Tests are an area of active ongoing development within Morio.
</Fixme>

Under the hood, this will run:

```sh title="Terminal"
npm run redev && \
sleep 5 && \
./api/run-test-container.sh && \
npm run redev
```

In other words, __this will destroy your local development environment__,
although it will spin it up again after running the tests.

