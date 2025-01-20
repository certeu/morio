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

# Make sure we have a version tag and release channel
ensureVersionTag
ensureReleaseChannel

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

# Build dbuilder container image
echo "👷 Building itsmorio/dbuilder:${MORIO_VERSION_TAG} container"
npm run build:dbuilder $RELEASE_CHANNEL

# Build dbuilder deb package
echo "👷 Building moriod package for Debian"
npm run docker:build.moriod.deb
cp build-context/dist/*.deb .

# Build dbuilder deb package
echo "👷 Building moriod-repo package for Debian"
npm run build:moriod-repo-deb
cp build-context/dist/*.deb .

echo "✅ Publishing images..."
docker push itsmorio/core:${MORIO_VERSION_TAG}${TAG_SUFFIX}
docker push itsmorio/core:${RELEASE_CHANNEL_TAG}
docker push itsmorio/api:${MORIO_VERSION_TAG}${TAG_SUFFIX}
docker push itsmorio/api:${RELEASE_CHANNEL_TAG}
docker push itsmorio/ui:${MORIO_VERSION_TAG}${TAG_SUFFIX}
docker push itsmorio/ui:${RELEASE_CHANNEL_TAG}
docker push itsmorio/dbuilder:${MORIO_VERSION_TAG}${TAG_SUFFIX}
docker push itsmorio/dbuilder:${MORIO_VERSION_TAG}${TAG_SUFFIX}

