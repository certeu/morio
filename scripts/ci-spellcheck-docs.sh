#!/bin/bash
# Sounce config variables
source config/cli.sh

shopt -s globstar
cd $MORIO_GIT_ROOT/docs
FOUND=''
for page in $MORIO_GIT_ROOT/docs/docs/**/readme.md; do
  LIST=$(cat $page | aspell --home-dir=../.aspell/ --mode=markdown list)
  if [ ! -z "${LIST}" ];
  then
    FOUND=page
    echo "Found spelling issues in $page:"
    echo "$LIST"
  fi
done
for page in $MORIO_GIT_ROOT/docs/jargon/*.md; do
  LIST=$(cat $page | aspell --home-dir=../.aspell/ --mode=markdown list)
  if [ ! -z "${LIST}" ];
  then
    FOUND=page
    echo "Found spelling issues in $page:"
    echo "$LIST"
  fi
done


if [ -z "${FOUND}" ];
then
  exit 0
else
  exit 1
fi

