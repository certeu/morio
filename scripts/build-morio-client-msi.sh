#!/bin/bash
set -e

# Check for wixl
if ! command -v wixl &> /dev/null; then
  echo "Error: wixl not found. Please install it (sudo apt install -y msitools wixl)"
  exit 1
fi

# Versions
VERSION=$(cat ./VERSION | xargs)
BEATS_VERSION=9.2.4
BEATS_BASE_URL="https://artifacts.elastic.co/downloads/beats"

# Directories
PKG_ROOT="./local/builds/windows/src"
PKG_BUILD="./local/builds/windows/build"
PKG_SRC="./pkgs/morio-client/windows"

# Clean and create directories
rm -rf "$PKG_ROOT"
rm -rf "$PKG_BUILD"
mkdir -p "$PKG_ROOT"
mkdir -p "$PKG_BUILD"

# Copy package source files
cp -R $PKG_SRC/* $PKG_ROOT

# Set the version
sed -i "s/MORIO_VERSION/${VERSION}.0/" "${PKG_ROOT}/morio.wxs"

# Copy the morio binary (we assume it was pre-built)
MORIO_BIN="$PKG_ROOT/../../morio-windows-amd64.exe"
if [ ! -f "$MORIO_BIN" ]; then
  echo "Error: morio-windows-amd64.exe not found at $MORIO_BIN"
  echo "Please build the Windows binary first"
  exit 1
fi
cp "$MORIO_BIN" "$PKG_ROOT/bin/morio.exe"

# Download and extract Elastic beats
# Windows ships as a ZIP rather than a tar.gz so we need some different logic here
download_beat() {
    local beat=$1
    local url="${BEATS_BASE_URL}/${beat}/${beat}-${BEATS_VERSION}-windows-x86_64.zip"
    local zip_file="${PKG_BUILD}/${beat}.zip"

    echo "  Downloading ${beat}..."
    wget -q -O "${zip_file}" "${url}"
    unzip -q -j "${zip_file}" "${beat}-${BEATS_VERSION}-windows-x86_64/${beat}.exe" -d "${PKG_ROOT}/bin/"
    rm "${zip_file}"
}
download_beat "auditbeat"
download_beat "filebeat"
download_beat "metricbeat"
download_beat "winlogbeat"

# Generate the .rtf file that is displayed in the GUI
cat > "${PKG_ROOT}/license.rtf" << 'EOF'
{\rtf1\ansi\deff0
{\fonttbl{\f0 Times New Roman;}}
\f0\fs24
MORIO CLIENT - LICENSE INFORMATION

Morio
Copyright © CERT-EU
Licensed under the European Union Public License, Version 1.2
https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12

Filebeat, Metricbeat, Winlogbeat
Copyright © Elastic N.V.
Licensed under the Apache License, Version 2.0
https://www.apache.org/licenses/LICENSE-2.0

}
EOF

echo "Building Windows morio package..."
cd "${PKG_ROOT}"
wixl -v -o "../build/morio-${VERSION}.msi" morio.wxs

echo ""
echo "✓ MSI created successfully!"
echo "  Location: ${PKG_BUILD}/morio-${VERSION}.msi"
echo ""

