#!/usr/bin/env bash
# Source config variables
source config/cli.sh

# This checks whether the RELEASE_CHANNEL env var is set
# If not, it bails out with a failure exit code
function ensureVersionTag {
  if [ -z "${MORIO_VERSION_TAG}" ]; then
    echo "Error: MORIO_VERSION_TAG is not set"
    exit 1
  fi
}

# This checks whether the RELEASE_CHANNEL env var is set
# If not, it bails out with a failure exit code
function ensureReleaseChannel {
  if [ -z "${RELEASE_CHANNEL}" ]; then
    echo "Error: RELEASE_CHANNEL is not set"
    echo "Please set it to one of 'stable', 'canary', or 'testing'"
    exit 1
  fi
  if [ "$RELEASE_CHANNEL" = "testing" ]; then
    echo "Release channel is: testing"
    TAG_SUFFIX="-$(git rev-parse HEAD)"
    RELEASE_CHANNEL_TAG="testing"
  fi
  if [ "$RELEASE_CHANNEL" = "canary" ]; then
    echo "Release channel is: canary"
    TAG_SUFFIX="-canary"
    RELEASE_CHANNEL_TAG="canary"
  fi
  if [ "$RELEASE_CHANNEL" = "stable" ]; then
    echo "Release channel is: stable"
    TAG_SUFFIX=""
    RELEASE_CHANNEL_TAG="latest"
  fi
}

# Function to build and publish a specific image
function buildAndPublishImage {
  local image_name=$1

  case $image_name in
    "core")
      echo "👷 Building @itsmorio/morio-core:${MORIO_VERSION_TAG} container"
      npm run build:core $RELEASE_CHANNEL
      docker push itsmorio/core:${MORIO_VERSION_TAG}${TAG_SUFFIX}
      docker push itsmorio/core:${RELEASE_CHANNEL_TAG}
      if [ "$RELEASE_CHANNEL" = "testing" ]; then
        docker push itsmorio/core:${MORIO_VERSION_TAG}-testing
      fi
      ;;
    "api")
      echo "👷 Building itsmorio/api:${MORIO_VERSION_TAG} container"
      npm run build:api $RELEASE_CHANNEL
      docker push itsmorio/api:${MORIO_VERSION_TAG}${TAG_SUFFIX}
      docker push itsmorio/api:${RELEASE_CHANNEL_TAG}
      if [ "$RELEASE_CHANNEL" = "testing" ]; then
        docker push itsmorio/api:${MORIO_VERSION_TAG}-testing
      fi
      ;;
    "tap")
      echo "👷 Building itsmorio/tap:${MORIO_VERSION_TAG} container"
      npm run build:tap $RELEASE_CHANNEL
      docker push itsmorio/tap:${MORIO_VERSION_TAG}${TAG_SUFFIX}
      docker push itsmorio/tap:${RELEASE_CHANNEL_TAG}
      if [ "$RELEASE_CHANNEL" = "testing" ]; then
        docker push itsmorio/tap:${MORIO_VERSION_TAG}-testing
      fi
      ;;
    "ui")
      echo "👷 Building itsmorio/ui:${MORIO_VERSION_TAG} container"
      npm run build:ui $RELEASE_CHANNEL
      docker push itsmorio/ui:${MORIO_VERSION_TAG}${TAG_SUFFIX}
      docker push itsmorio/ui:${RELEASE_CHANNEL_TAG}
      if [ "$RELEASE_CHANNEL" = "testing" ]; then
        docker push itsmorio/ui:${MORIO_VERSION_TAG}-testing
      fi
      ;;
    *)
      echo "Error: Unknown image '$image_name'"
      echo "Available images: core, api, tap, ui"
      exit 1
      ;;
  esac
}

# Function to build and publish all images
function buildAndPublishAll {
  # Build core container image
  echo "👷 Building @itsmorio/morio-core:${MORIO_VERSION_TAG} container"
  npm run build:core $RELEASE_CHANNEL

  # Build api container image
  echo "👷 Building itsmorio/api:${MORIO_VERSION_TAG} container"
  npm run build:api $RELEASE_CHANNEL

  # Build tap container image
  echo "👷 Building itsmorio/tap:${MORIO_VERSION_TAG} container"
  npm run build:tap $RELEASE_CHANNEL

  # Build ui container image
  echo "👷 Building itsmorio/ui:${MORIO_VERSION_TAG} container"
  npm run build:ui $RELEASE_CHANNEL

  echo "✅ Publishing images..."
  docker push itsmorio/core:${MORIO_VERSION_TAG}${TAG_SUFFIX}
  docker push itsmorio/core:${RELEASE_CHANNEL_TAG}
  docker push itsmorio/api:${MORIO_VERSION_TAG}${TAG_SUFFIX}
  docker push itsmorio/api:${RELEASE_CHANNEL_TAG}
  docker push itsmorio/tap:${MORIO_VERSION_TAG}${TAG_SUFFIX}
  docker push itsmorio/tap:${RELEASE_CHANNEL_TAG}
  docker push itsmorio/ui:${MORIO_VERSION_TAG}${TAG_SUFFIX}
  docker push itsmorio/ui:${RELEASE_CHANNEL_TAG}
  # Testing requires an extra tag
  if [ "$RELEASE_CHANNEL" = "testing" ]; then
    docker push itsmorio/core:${MORIO_VERSION_TAG}-testing
    docker push itsmorio/api:${MORIO_VERSION_TAG}-testing
    docker push itsmorio/tap:${MORIO_VERSION_TAG}-testing
    docker push itsmorio/ui:${MORIO_VERSION_TAG}-testing
  fi
}

# Make sure we have a version tag and release channel
ensureVersionTag
ensureReleaseChannel

# Check if a specific image was requested
if [ $# -eq 0 ]; then
  # No arguments - build all images
  buildAndPublishAll
elif [ $# -eq 1 ]; then
  # One argument - build specific image
  echo "✅ Building and publishing specific image: $1"
  buildAndPublishImage $1
else
  # Too many arguments
  echo "Error: Too many arguments"
  echo "Usage: $0 [image_name]"
  echo "Available images: core, api, tap, ui"
  exit 1
fi

echo "✅ Done!"
