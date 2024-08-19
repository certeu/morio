#!/bin/bash
# Sounce config variables
source config/cli.sh

shopt -s globstar
cd $MORIO_GIT_ROOT/docs
for page in $MORIO_GIT_ROOT/docs/docs/**/readme.md; do
  aspell --home-dir=../.aspell/ check --dont-backup --mode=markdown $page
done
for page in $MORIO_GIT_ROOT/docs/jargon/*.md; do
  aspell --home-dir=../.aspell/ check --dont-backup --mode=markdown $page
done

