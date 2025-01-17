#!/bin/bash
source .github/workflows/lib.sh

# Exit on all errors
set -e

# This is the template used for the comment
export COMMENT_TEMPLATE=".github/workflows/integration-tests.md"

# And these are the defaults to be injected into the template
export CI_HEADER="As requested by @{{ COMMENT_AUTHOR }} in [this comment]({{ COMMENT_URL }}), we will now proceed to test this pull request.<br>To do so, we will provision ephemeral infrastructure to run the end-to-end tests. This will take a while, but we will keep you abreast by updating this comment as we make progress."
export CI_STATUS_REPO="Pending"
export CI_STATUS_DEPS="Pending"
export CI_STATUS_UCORE="Pending"
export CI_STATUS_UAPI="Pending"
export CI_ICON_REPO="➖"
export CI_ICON_DEPS="➖"
export CI_ICON_UCORE="➖"
export CI_ICON_UAPI="➖"
export CI_FOOTER="We will update this summary as the workflow progresses."
export CI_ERROR_FOOTER=""

# Create the intial comment to inform the user
# But since we already have the repo setup, reflect that
export CI_STATUS_REPO="Success"
export CI_ICON_REPO="✅"
export CI_STATUS_DEPS="Starting..."
export CI_ICON_DEPS="⏳"
createPrComment

# Install dependencies, CI style
# See: https://docs.npmjs.com/cli/v11/commands/npm-ci
npm ci

# We cannot continue, so let's inform the user
export CI_STATUS_DEPS="Success"
export CI_ICON_DEPS="✅"
export CI_STATUS_UCORE="Skipped"
export CI_ICON_UCORE="⏩"
export CI_STATUS_UAPI="Skipped"
export CI_ICON_UAPI="⏩"
export CI_ERROR_FOOTER="The unit tests cannot be ran on a GitHub hosted runner, so they are skipped for now"
updatePrComment

# The rest needs to run on a self-hosted runner
# but the steps are:

# Run core unit tests
# npm run test:core

# Run api unit tests
# npm run test:api
