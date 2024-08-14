#!/bin/bash
PAGE="---
title: FIXME
---

<Fixme>Write this page</Fixme>
"

mkdir build                    && echo $PAGE > build/readme.md
mkdir build-api                && echo $PAGE > build:api/readme.md
mkdir build-core               && echo $PAGE > build:core/readme.md
mkdir build-dbuilder           && echo $PAGE > build:dbuilder/readme.md
mkdir build-dev                && echo $PAGE > build:dev/readme.md
mkdir build-prod               && echo $PAGE > build:prod/readme.md
mkdir build-tests              && echo $PAGE > build:tests/readme.md
mkdir build0ui                 && echo $PAGE > build:ui/readme.md
mkdir ci-build-api             && echo $PAGE > ci:build:api/readme.md
mkdir ci-build-core            && echo $PAGE > ci:build:core/readme.md
mkdir ci-build-dbuilder        && echo $PAGE > ci:build:dbuilder/readme.md
mkdir ci-build-moriod-deb      && echo $PAGE > ci:build:moriod:deb/readme.md
mkdir ci-build-moriod-rpm      && echo $PAGE > ci:build:moriod:rpm/readme.md
mkdir ci-build-ui              && echo $PAGE > ci:build:ui/readme.md
mkdir ci-eslint                && echo $PAGE > ci:eslint/readme.md
mkdir ci-prettier              && echo $PAGE > ci:prettier/readme.md
mkdir docker-build.moriod.deb  && echo $PAGE > docker:build:moriod:deb/readme.md
mkdir docker-build.moriod.rpm  && echo $PAGE > docker:build:moriod:rpm/readme.md
mkdir destroy                  && echo $PAGE > destroy/readme.md
mkdir dev                      && echo $PAGE > dev/readme.md
mkdir get                      && echo $PAGE > get/readme.md
mkdir kickstart                && echo $PAGE > kickstart/readme.md
mkdir lint                     && echo $PAGE > lint/readme.md
mkdir logs-api                 && echo $PAGE > logs:api/readme.md
mkdir logs-core                && echo $PAGE > logs:core/readme.md
mkdir prebuild                 && echo $PAGE > prebuild /readme.md
mkdir predev                   && echo $PAGE > predev/readme.md
mkdir preprod                  && echo $PAGE > preprod/readme.md
mkdir prettier                 && echo $PAGE > prettier/readme.md
mkdir prod                     && echo $PAGE > prod/readme.md
mkdir reconfigure              && echo $PAGE > reconfigure/readme.md
mkdir redev                    && echo $PAGE > redev/readme.md
mkdir reversion                && echo $PAGE > reversion/readme.md
mkdir rev                      && echo $PAGE > rev/readme.md
mkdir test-api                 && echo $PAGE > test:api/readme.md
mkdir test-core                && echo $PAGE > test:core/readme.md
mkdir test                     && echo $PAGE > test/readme.md
mkdir tests                    && echo $PAGE > tests/readme.md

