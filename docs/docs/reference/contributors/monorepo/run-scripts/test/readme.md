---
title: test
---

The `test` _run script_ outputs information on how to run tests.

Run `npm run test` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
echo \"No test target specified.\nTry 'npm run test:api' or 'npm run test:core' instead.\" && \
exit 1
```

In other words, this script does nothing, but output the following:

```
No test target specified.
Try 'npm run test:api' or 'npm run test:core' instead.
```

<Note>
#### Why maintain a run script that does nothing?

Because Morio is a _monorepo_ using containers, testing is a bit _complicated_ and currently a work in progress.

Given that `npm run test` is a common way to run tests in the JavaScript
ecosystem, we keep this run script to onboard new contributors, and point
them in the right direction for running tests..
</Note>
