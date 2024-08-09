import { pkg } from './json-loader.mjs'

export const version = pkg.version

export const deb = {
  /*
   * Control file required to build a .deb package
   */
  control: `
Package: moriod
Source: moriod
Version: ${pkg.version}
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
Depends: docker.io, systemd
Uploaders: Joost De Cock <joost.decock@cert.europa.eu>
`,
  /*
   * Contents of the /etc/morio/moriod/moriod.env file that should be added to the package
   */
  moriodEnv: `#
# This file holds environment variables for Morio
# It is used as an EnvironmentFile in the systemd unit file for moriod (Morio Core).
#
# You can (uncomment and) change these values to customize your moriod setup.
#
# However, after Morio has been setup, you should not change
# the various locations with a _ROOT suffix as doing so will break your setup.
#

# Location of the Docker socket
#MORIO_DOCKER_SOCKET="/var/run/docker.sock"

# Node environment
#NODE_ENV="production"

#
# After Morio has been setup, you should not change the variables below.
# Doing so will break your setup.
#

# Location of the Morio configuration folder
#MORIO_CONFIG_ROOT="/etc/morio"

# Location of the Morio data folder
#MORIO_DATA_ROOT="/var/lib/morio"

# Location of the Morio logs folder
#MORIO_LOGS_ROOT="/var/log/morio"

# Log level for Morio core
#MORIO_CORE_LOG_LEVEL="warn"
`,
  /*
   * Post install file to govern what happens after the package is installed
   */
  postinst: `#!/bin/bash
# Post-Install script for moriod

set -e

# Reload systemd
systemctl daemon-reload || true

# Enable services
systemctl enable docker || true
systemctl enable moriod || true

# Start services
systemctl start docker || true
systemctl start moriod || true
`,
  /*
   * Contents of the /etc/morio/moriod/version file that should be added to the package
   */
  version: pkg.version,
  /*
   * Contents of the /etc/morio/moriod/version.env file that should be added to the package
   */
  versionEnv: `#
# This file is auto-generated by the moriod software pacakge.
# Under normal circumstances, you should not edit it.
#
# This file holds the MORIO_VERSION variable, which controls the morio docker tag systemd will start.
# It is installed/provided by the modiod package and will by updated when you update the package.
#

MORIO_VERSION=${pkg.version}
`,
}
