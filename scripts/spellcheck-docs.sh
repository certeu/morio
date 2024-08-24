#!/bin/bash
# Sounce config variables
source config/cli.sh

function spellcheck () {
  aspell --home-dir=../.aspell/ check --dont-backup --mode=markdown -d en_GB $1
}

shopt -s globstar
cd $MORIO_GIT_ROOT/docs
for page in $MORIO_GIT_ROOT/docs/docs/**/readme.md; do
  spellcheck $page
done
for page in $MORIO_GIT_ROOT/docs/jargon/*.md; do
  spellcheck $page
done
for page in $MORIO_GIT_ROOT/docs/blog/*/index.md; do
  spellcheck $page
done

