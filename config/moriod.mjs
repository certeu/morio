import fs from 'fs'
import path from 'path'
import { pkg } from './json-loader.mjs'

/**
 * The morio root folder
 */
const root = path.resolve(path.basename(import.meta.url), '..')

/**
 * Recursively reads the contents of a directory
 *
 * This is included here because importing shared/fs would require
 * installing js-yaml when running in a CI pipeline
 *
 * @param {string} dirPath - (relative) path to the directory to read
 */
export const readDirectory = async (dirPath) => {
  let files = []
  try {
    const dir = path.resolve(root, dirPath)
    files = await fs.promises.readdir(dir, { recursive: true })
  } catch (err) {
    console.log(err)

    return files
  }

  return files
}

const noRpmFiles = ['control', 'postinst']

/*
 * Let's not maintain a list of files by hand
 */
const getMoriodFiles = async () => await readDirectory('moriod')

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
Homepage: https://morio.it
Description: Umbrella package for Morio
  Morio is an end-to-end streaming data backbone
  for your observability needs.
Vcs-Git: https://github.com/certeu/morio -b main [clients/linux]
Depends: docker.io, systemd
Uploaders: Joost De Cock <joost.decock@cert.europa.eu>
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
}

/*
 * Contents of the /etc/morio/moriod/moriod.env file that should be added to the package
 */
export const moriodEnv = `#
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
`

/*
 * Contents of the /etc/morio/moriod/version.env file that should be added to the package
 */
export const versionEnv = `#
# This file is auto-generated by the moriod software pacakge.
# Under normal circumstances, you should not edit it.
#
# This file holds the MORIO_VERSION variable, which controls the morio docker tag systemd will start.
# It is installed/provided by the modiod package and will by updated when you update the package.
#

MORIO_VERSION=${pkg.version}
`

export const rpm = {
  spec: `
Name: moriod
Version: ${pkg.version}
Release: 0%{?dist}
Summary: Morio provides the plumbing for your observability needs.
License: EUPL
URL: https://github.com/certeu/morio
Requires: docker.io

%description
Morio allows you to connect your systems, ingest their logs, metrics
and audit info, and do stream processing and analysis in real time.

This is the Morio distribution, which provides the Morio core service, running inside Docker.

Documentation: https://morio.it

%install
mkdir -p %{buildroot}/etc/morio/moriod
mkdir -p %{buildroot}/var/lib/morio/moriod
mkdir -p %{buildroot}/usr/sbin/
mkdir -p %{buildroot}/etc/systemd/system/
mkdir -p %{buildroot}/usr/share/man/man8
cp -R %{_sourcedir}/etc/morio/moriod %{buildroot}/etc/morio
cp %{_sourcedir}/usr/sbin/moriod %{buildroot}/usr/sbin
cp %{_sourcedir}/var/lib/morio/moriod-completion.sh %{buildroot}/var/lib/morio/moriod-completion.sh
cp %{_sourcedir}/usr/share/man/man8/moriod.8 %{buildroot}/usr/share/man/man8/moriod.8
cp %{_sourcedir}/etc/systemd/system/moriod.service %{buildroot}/etc/systemd/system/moriod.service
echo %{name}-%{version}-%{release}.%{_arch}

%files
${
/*
 * Let us not maintain a list of files by hand
 */
(await getMoriodFiles().then(files => files
  .filter(file => !noRpmFiles.includes(file))
  .map(file => '/' + file)
  .join("\n") + `

%clean
rm -rf %{buildroot}

%post
`))}`
}

