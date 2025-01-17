#!/bin/bash
source .github/workflows/lib.sh

# Exit on all errors
set -e

# This is the template used for the comment
export COMMENT_TEMPLATE=".github/workflows/unit-tests.md"

# And these are the defaults to be injected into the template
export CI_HEADER="As requested by @{{ COMMENT_AUTHOR }} in [this comment]({{ COMMENT_URL }}), we will now proceed to run unit tests.<br>To do so, we will provision ephemeral infrastructure to run the tests. This will take a while, but we will keep you abreast by updating this comment as we make progress."
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
export CI_ICON_DEPS="🚀"
createPrComment

# Install dependencies, CI style
# See: https://docs.npmjs.com/cli/v11/commands/npm-ci
npm ci

# Inform the user by updating our comment
export CI_STATUS_DEPS="Success"
export CI_ICON_DEPS="✅"
export CI_STATUS_UCORE="Starting..."
export CI_ICON_UCORE="🚀"
updatePrComment

# Run core unit tests
npm run test:core

# Inform the user by updating our comment
export CI_STATUS_UCORE="Success"
export CI_ICON_UCORE="✅"
export CI_STATUS_UAPI="Starting..."
export CI_ICON_UCAPI="🚀"
updatePrComment

# Run API unit tests
npm run test:api

# Inform the user by updating our comment
export CI_STATUS_UAPI="Success"
export CI_ICON_UAPI="✅"
updatePrComment

# TODO: Upload code coverage report
