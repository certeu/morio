#!/usr/bin/env bash
# Source cli config
source config/cli.sh

# Check title
head -n 10 $1 | grep "^title:" > /dev/null
result=$?
if [ $result -ne 0 ]; then
  echo "Page lacks title in frontmatter: $1"
  error=1
fi

# Check spelling
aspell --home-dir=.aspell/ --dont-backup --mode=markdown -d en_GB check $1

