#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

#
# This will build container images and packages locally
# You can use this for local testing or to generate images
# to publish to the `testing` channel.

# Build core container image
echo "👷 Building itsmorio/core:${MORIO_VERSION_TAG} container"
npm run build:core prod

# Build api container image
echo "👷 Building itsmorio/api:${MORIO_VERSION_TAG} container"
npm run build:api prod

# Build ui container image
echo "👷 Building itsmorio/ui:${MORIO_VERSION_TAG} container"
npm run build:ui prod

# Build dbuilder container image
echo "👷 Building itsmorio/dbuilder:${MORIO_VERSION_TAG} container"
npm run build:dbuilder prod

# Build dbuilder deb package
echo "👷 Building moriod package for Debian"
npm run docker:build.moriod.deb
cp build-context/dist/*.deb .

# Build dbuilder deb package
echo "👷 Building moriod-repo package for Debian"
npm run build:moriod-repo-deb
cp build-context/dist/*.deb .

# Ask if we should also push these images as version
echo "🤔 Would you like to publish these images under their version tag?"
read -p "Publish images as ${MORIO_VERSION_TAG}? (y/N)" answer

# Check the user's input
if [[ "$answer" == "y" ]]; then
  echo "✅ Publishing images..."
  docker push itsmorio/core:${MORIO_VERSION_TAG}
  docker push itsmorio/api:${MORIO_VERSION_TAG}
  docker push itsmorio/ui:${MORIO_VERSION_TAG}
  docker push itsmorio/dbuilder:${MORIO_VERSION_TAG}
else
  echo "⛔ Not publishing images as ${MORIO_VERSION_TAG}"
fi

# Ask if we should also push these images as testing
echo "🤔 Would you like to publish these images under the 'testing' tag?"
read -p "Publish images as testing? (y/N)" answer

# Check the user's input
if [[ "$answer" == "y" ]]; then
  echo "✅ Publishing images..."
  docker push itsmorio/core:testing
  docker push itsmorio/api:testing
  docker push itsmorio/ui:testing
  docker push itsmorio/dbuilder:testing
else
  echo "⛔ Not publishing images as testing"
fi


