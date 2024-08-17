--- 
title: spellcheck
---

The `spellcheck` _run script_ runs the [aspell](http://aspell.net/) 
spell checker on the documentation.

Run `npm run spellcheck` in the _monorepo_ root to trigger this script.

This is an interactive script, the spell checker will prompty you what to
do when an issue is found. If you instruct it to, it will make changes
to the documentation to fix the found issues. It will not make backup
files as aspell does by default.

Under the hood, this will run:

```sh title="Terminal"
./scripts/spellcheck-docs.sh
```

## Prerequisites

This relies on the [aspell](http://aspell.net/) package being available.


