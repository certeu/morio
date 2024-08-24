#!/bin/bash
# Sounce config variables
source config/cli.sh

shopt -s globstar
cd $MORIO_GIT_ROOT/docs
FOUND=''

function spellcheck () {
  LIST=$(sed '/<!-- start-spellcheck-skip -->/,/<!-- end-spellcheck-skip -->/d' $1 | \
    grep -v "skip-spellcheck" | \
    aspell --home-dir=../.aspell/ --mode=markdown -d en_GB list)
  if [ ! -z "${LIST}" ];
  then
    FOUND=page
    echo "Found spelling issues in $1:"
    echo "$LIST"
  fi
}


for page in $MORIO_GIT_ROOT/docs/docs/**/readme.md; do
  spellcheck $page
done
for page in $MORIO_GIT_ROOT/docs/jargon/*.md; do
  spellcheck $page
done
for page in $MORIO_GIT_ROOT/docs/blog/*/index.md; do
  spellcheck $page
done

if [ -z "${FOUND}" ];
then
  exit 0
else
  exit 1
fi

