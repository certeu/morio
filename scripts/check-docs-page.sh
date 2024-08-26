#!/bin/bash
# Sounce config variables
source config/cli.sh

# Check title
head -n 10 $1 | grep "^title:" > /dev/null
result=$?
if [ $result -ne 0 ]; then
  echo "❌ Page lacks title in frontmatter: $1"
  exit 1
fi

# Check spelling
LIST=$(sed '/<!-- start-spellcheck-skip -->/,/<!-- end-spellcheck-skip -->/d' $1 | \
  grep -v "skip-spellcheck" | \
  aspell --home-dir=.aspell/ --dont-backup --mode=markdown -d en_GB list)
if [ ! -z "${LIST}" ];
then
  echo "❌ Found spelling issues in $1:"
  echo "$LIST"
else
  echo "✅ Looks good."
fi

