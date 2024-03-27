#!/bin/bash

# Set up folder
SRC=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && cd ../moriod && pwd )
DIST=$( cd $SRC && cd ../data/data/tmp_static && pwd )

# Grab the Morio version from package.json
VERSION=`sed 's/\"version\"/\"VERSION\"/' $SRC/../package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

# Write out control file
cat <<EOF > $SRC/control
Package: moriod
Source: moriod
Version: $VERSION
Section: utils
Priority: optional
Architecture: amd64
Essential: no
Installed-Size: 500000
Maintainer: CERT-EU <services@cert.europa.eu>
Changed-By: Joost De Cock <joost.decock@cert.europa.eu>
Homepage: https://github.com/certeu/morio
Description: Umbrella package for Morio
  Morio is an end-to-end streaming data backbone
  for your observability needs.
Vcs-Git: https://github.com/certeu/morio -b main [clients/linux]
Depends: docker.io (>= 20)
Uploaders: Joost De Cock <joost.decock@cert.europa.eu>
EOF

# Write out EnvironmentFile for systemd
cat <<EOF > $SRC/etc/morio/core.env
#
# This file holds environment variables for Morio
#
# It is used as an EnvironmentFile in the systemd unit file for moriod (Morio Core).
# This file, along with the systemd unit file, was installed by the moriod package.
# You can change these values, but you should not change the various locations
# (with a _ROOT suffix) after Morio has been setup as they will be maped into the
# containers as volumes.
#

# Morio version
MORIO_VERSION="${VERSION}"

# Location of the Docker socket
MORIO_DOCKER_SOCKET="/var/run/docker.sock"

# Location of the Morio configuration folder
MORIO_CONFIG_ROOT="/etc/morio"

# Location of the Morio data folder
MORIO_DATA_ROOT="/var/lib/morio"

# Location of the Morio logs folder
MORIO_LOGS_ROOT="/var/log/morio"

# Log level for Morio core
MORIO_CORE_LOG_LEVEL="warn"

# Node environment
NODE_ENV="production"
EOF

# Write out version file
echo $VERSION > $SRC/etc/morio/version

docker run -it \
  --rm \
  -v $SRC:/morio/src \
  -v $DIST:/morio/dist \
  -- \
  morio/dbuilder

