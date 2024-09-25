#!/usr/bin/env bash
#
# This script will build the .deb package to add the morio APT
# repository to a system.

# Sounce config variables
source config/cli.sh

# Create package structure
cd $MORIO_GIT_ROOT
rm -rf build-context/*
rm -rf build-context/.*
mkdir -p build-context/usr/share/keyrings
mkdir -p build-context/etc/apt/sources.list.d
mkdir -p build-context/var
cp morio.gpg build-context/usr/share/keyrings/
echo "# Moriod repository. See https://apt.repo.morio.it/" > build-context/etc/apt/sources.list.d/moriod.list
echo "deb [signed-by=/usr/share/keyrings/morio.gpg] https://apt.repo.morio.it/ $(lsb_release -cs) main" >> build-context/etc/apt/sources.list.d/moriod.list
cat config/moriod-repos/deb/control | sed "s/MORIO_VERSION/${MORIO_VERSION}/g" > build-context/control
cp config/moriod-repos/deb/postinst build-context/

# Build package
docker run -it \
  -v ${MORIO_GIT_ROOT}/build-context:/morio/src \
  -v ${MORIO_GIT_ROOT}/data/data:/morio/dist \
  itsmorio/dbuilder
