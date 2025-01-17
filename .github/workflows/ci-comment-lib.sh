#!/bin/bash

# This installs the mustache templating language for bash
# But only if it's not already in place (checks ./local/bin/mo)
function ensureMo {
  if [ -f "path/to/file" ]; then
    echo "Found mo"
  else
    echo "Installing mo (the mustache templating language for Bash)"
    mkdir -p .local/bin/
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
function createComment {
  ensureMo
  ensurePrNumber
  cat .github/workflows/ci-comment-template-tests.md | ./local/bin/mo | gh pr comment $PR_NUMBER -
}

# This updates the PR comment
function updateComment {
  ensureMo
  ensurePrNumber
  cat .github/workflows/ci-comment-template-tests.md | ./local/bin/mo | gh pr comment --edit-last $PR_NUMBER -
}

export HEADER="As requested by @{{ COMMENT_AUTHOR }} in [this comment]({{ COMMENT_URL }}), we will now proceed to test this pull request.<br>To do so, we will provision ephemeral infrastructure to run the end-to-end tests. This will take a while, but we will keep you abreast by updating this comment as we make progress.\n\n#### Summary"
export CI_STATUS_REPO="Pending"
export CI_STATUS_DEPS="Pending"
export CI_STATUS_UCORE="Pending"
export CI_STATUS_UAPI="Pending"
export CI_ICON_REPO="➖"
export CI_ICON_DEPS="➖"
export CI_ICON_UCORE="➖"
export CI_ICON_UAPI="➖"
export FOOTER="We will update this summary as the workflow progresses."
export ERRORFOOTER=""

