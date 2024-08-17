--- 
title: ci:spellcheck
---

The `ci:spellcheck` _run script_ runs the [aspell](http://aspell.net/) 
spell checker on the documentation.

Run `npm run spellcheck` in the _monorepo_ root to trigger this script.

This will list any issues and exit with a non-0 exit code if issues
are found, thus failing the pipeline. It won't make any changes to
the documentation.

Under the hood, this will run:

```sh title="Terminal"
./scripts/ci-spellcheck-docs.sh
```

## Prerequisites

This relies on the [aspell](http://aspell.net/) package being available.


