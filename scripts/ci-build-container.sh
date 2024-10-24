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

source config/cli.sh

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

  # Release to tag this with
  # Either `latest` for production or `next` for a pre-release
  if [[ "$MORIO_VERSION_TAG" == *-* ]]; then
    MORIO_RELEASE="next"
  else
    MORIO_RELEASE="latest"
  fi

  # Create a folder for the build context
  rm -rf $MORIO_GIT_ROOT/build-context
  mkdir -p $MORIO_GIT_ROOT/build-context
  if [[ $IMAGE == *"builder" ]]
  then
    cd $MORIO_GIT_ROOT/builders/$IMAGE
  else
    cd $MORIO_GIT_ROOT/$IMAGE
  fi
  tar -ch -f $MORIO_GIT_ROOT/build-context.tar . && cd $MORIO_GIT_ROOT/build-context && tar -xf $MORIO_GIT_ROOT/build-context.tar . && cd $MORIO_GIT_ROOT

  # Now build the OCI image
  buildah build-using-dockerfile \
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
    --tag docker.io/itsmorio/$IMAGE:$MORIO_VERSION_TAG \
    --tag docker.io/itsmorio/$IMAGE:$MORIO_RELEASE \
    ./build-context

  if [ $? -eq 0 ]
  then
    echo "Successfully built OCI image itsmorio/$IMAGE"
  else
    echo "Failed to build OCI image itsmorio/$IMAGE"
    exit 1
  fi

  if [ -z "$2" ];
  then
    echo "Not publishing the newly built image."
    exit 0
  elif [ "publish" == $2 ]
  then
    echo "Attempting to login to the Docker registry."
    buildah login -u $DOCKER_USERNAME -p $DOCKER_PAT docker.io
    if [ $? -eq 0 ]
    then
      echo "Successfully logged in to the Docker registry"
    else
      echo "Failed to login to the Docker registry"
      exit 1
    fi

    echo "Attempting to publish image: Tag = latest"
    buildah push docker.io/itsmorio/$IMAGE:$MORIO_RELEASE
    if [ $? -eq 0 ]
    then
      echo "Successfully pushed image: itsmorio/$IMAGE:$MORIO_RELEASE"
    else
      echo "Failed to push image: itsmorio/$IMAGE:$MORIO_RELEASE"
      exit 1
    fi

    buildah push docker.io/itsmorio/$IMAGE:$MORIO_VERSION_TAG
    if [ $? -eq 0 ]
    then
      echo "Successfully pushed image: itsmorio/$IMAGE:$MORIO_VERSION_TAG"
    else
      echo "Failed to push image: itsmorio/$IMAGE:$MORIO_VERSION_TAG"
      exit 1
    fi
  else
    echo "Extra parameter not recognized."
    exit 1
  fi

  echo "All done"
  exit 0
fi


