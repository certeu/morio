#!/bin/bash

# This installs the mustache templating language for bash
# But only if it's not already in place (checks ./local/bin/mo)
function ensureMo {
  if [ -f "./local/bin/mo" ]; then
    echo "Found mo"
  else
    echo "Installing mo (the mustache templating language for Bash)"
    mkdir -p ./local/bin/
    curl -sSL https://raw.githubusercontent.com/tests-always-included/mo/master/mo -o ./local/bin/mo
    chmod +x ./local/bin/mo
  fi
}

# This checks whether the PR_NUMBER env var is set
# If not, it bails out with a failure exit code
function ensurePrNumber {
  if [ -z "${PR_NUMBER}" ]; then
    echo "Error: PR_NUMBER is not set"
    echo "Before you call this function, please ensure to set PR_NUMBER"
    echo "to the number of the pull request you want to load the comment from."
    exit 1
  fi
}

# This creates the initial PR comment
function createPrComment {
  ensureMo
  ensurePrNumber
  cat $COMMENT_TEMPLATE | ./local/bin/mo | gh pr comment $PR_NUMBER --body-file -
}

# This updates the PR comment
function updatePrComment {
  ensureMo
  ensurePrNumber
  cat $COMMENT_TEMPLATE | ./local/bin/mo | gh pr comment --edit-last $PR_NUMBER --body-file -
}

