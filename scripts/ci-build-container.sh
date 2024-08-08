#!/bin/bash
#
# This script is different from our local build script which uses
# Docker to build images from a tarball piped into the command (STDIN).
#
# In a CI environment, access to Docker is not always obvious, so we
# instead use Buildah and expect this script to be called with a URL
# to (a tarball of) the build context.
#
# In practice, CI first creates the tarball as an artificat, then this
# script runs and uses that tarball to build the OCI image.
#
# To run/test this locally, first cheate the tarball (example for itsmorio/root)
#   cd root && tar -ch . > root.tar
# Then upload it somewhere and pass that URL tot his script
#   ./scripts/ci-build-container.sh core https://my-webhost/root.tar


#
# A bit of input validation to catch obvious mistakes
# Are we building something that we know what to do with?
#
if [ -z "$1" ];
then
  echo "Please specify which container to build as a parameter to this script. Eg:"
  echo "ci-build-container.sh api https://my-webhost/my-context.tar.gz"
  exit 0
else
  if [ "api" == $1 ]
  then
    echo ""
    echo "Building itsmorio/api OCI container image."
    echo "Using build context: $CONTEXT"
    echo ""
    IMAGE="api"
    TITLE="The Morio Management API"
    DESC="The Morio API Service (api) provides the main user-facing API in Morio. It is an OpenAPI v3.1 compliant API, with auto-gereated reference documentation available at https://morio.it/oas-api"
  elif [ "core" == $1 ]
  then
    echo ""
    echo "Building itsmorio/core OCI container image."
    echo ""
    IMAGE="core"
    TITLE="Morio Core"
    DESC="The Morio Core Service (core) sits at the root of any Morio deployment and is responsible for orchestration, configuration resolution, and clustering."
  elif [ "dbuilder" == $1 ]
  then
    echo ""
    echo "Building itsmorio/dbuilder OCI container image."
    echo ""
    IMAGE="dbuilder"
    TITLE="Morio Client Builder for Debian-based Linux distributions"
    DESC="The Morio Debian Builder Service (dbuilder) is an on-demand service that builds Morio client packages in .deb format, the package format used by Debian-based Linux distributions."
  elif [ "ui" == $1 ]
  then
    echo ""
    echo "Building itsmorio/ui OCI container image."
    echo ""
    IMAGE="ui"
    TITLE="Morio User Interface"
    DESC="The Morio User Interface Service (ui) provides a web-based user interface for interacting with your Morio deployment."
  else
    echo ""
    echo "Not building '$1' as it is not a known container image."
    exit 1
  fi
  # Container to build
  CONTAINER="itsmorio/$IMAGE"

  # Figure out the repository root
  REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

  # Grab the Morio version from package.json
  MORIO_VERSION=`sed 's/\"version\"/\"VERSION\"/' $REPO/package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

  # Create a folder for the build context
  rm -rf $REPO/build-context
  mkdir -p $REPO/build-context
  cd $REPO/$IMAGE && tar -ch -f $REPO/build-context.tar . && cd $REPO/build-context && tar -xf $REPO/build-context.tar . && cd $REPO

  # Now build the OCI image
  IMAGE_ID=$(buildah build-using-dockerfile \
    --file Containerfile.prod \
    --label org.opencontainers.image.created="`date --rfc-3339='seconds'`" \
    --label org.opencontainers.image.authors="CERT-EU <services@cert.europa.eu>" \
    --label org.opencontainers.image.url="https://morio.it/" \
    --label org.opencontainers.image.documentation="https://morio.it/docs/" \
    --label org.opencontainers.image.source="https://github.com/certeu/morio" \
    --label org.opencontainers.image.version="$MORIO_VERSION" \
    --label org.opencontainers.image.revision="$GITHUB_SHA" \
    --label org.opencontainers.image.vendor="CERT-EU" \
    --label org.opencontainers.image.title="$TITLE" \
    --label org.opencontainers.image.description="$DESC" \
    --tag docker.io/itsmorio/$IMAGE:v$MORIO_VERSION \
    --tag docker.io/itsmorio/$IMAGE:latest \
    ./build-context)

  echo "Build completed."

  if [ -z "$2" ];
  then
    echo "Not publishing the newly built image."
  elif [ "publish" == $2 ]
  then
    echo "Attempting to login login to the Docker registry."
    buildah login docker.io -u $DOCKER_USERNAME -p $DOCKER_PAT
    echo "Attempting to publish image: Tag = latest"
    buildah push $IMAGE_ID docker://docker.io/itsmorio/$IMAGE:latest
    buildah push $IMAGE_ID docker://docker.io/itsmorio/$IMAGE:v$MORIO_VERSION
  else
    echo "Extra parameter not recognized."
    exit 1
  fi

  echo "All done"
  exit 0
fi


