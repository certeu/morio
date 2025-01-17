#!/bin/bash
source .github/workflows/ci-comment-lib.sh

# Exit on all errors
set -e

# Create the intial comment to inform the user
# But since we already have the repo setup, reflect that
export CI_STATUS_REPO="Success"
export CI_ICON_REPO="✅"
export CI_STATUS_DEPS="Starting..."
export CI_ICON_DEPS="⏳"
createComment

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
updateComment

# The rest needs to run on a self-hosted runner
# but the steps are:

# Run core unit tests
# npm run test:core

# Run api unit tests
# npm run test:api
