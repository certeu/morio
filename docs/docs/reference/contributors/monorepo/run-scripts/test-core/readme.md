---
title: test:core
---

The `test:core` _run script_ runs unit tests on the _core service_.

Run `npm run test:core` in the _monorepo_ root to trigger this script.

<Fixme>
#### YYMV
Tests are an area of active ongoing development within Morio.
</Fixme>

Under the hood, this will run:

```sh title="Terminal"
npm run destroy && \
./core/run-test-container.sh && \
npm run redev
```

In other words, **this will destroy your local development environment**,
although it will spin it up again after running the tests.
