#!/bin/bash
set -e

# Versions
VERSION=$(cat ./VERSION | xargs)
BEATS_VERSION=9.2.4

# Directories
PKG_ROOT="./local/builds/macos/src"
PKG_BUILD="./local/builds/macos/build"
PKG_SRC="./pkgs/morio-client/macos"

# Clean and create directories
rm -rf "$PKG_ROOT"
rm -rf "$PKG_BUILD"
mkdir -p "$PKG_ROOT"
mkdir -p "$PKG_BUILD"

# Copy package source files
cp -R $PKG_SRC/* $PKG_ROOT

# Copy the morio binary (we assume it was pre-built)
cp $PKG_ROOT/../../morio-macos-arm64 $PKG_ROOT/bin/morio

# Download and extract Elastic beats
echo "Downloading Filebeat from Elatic.co..."
curl -L -o "$PKG_BUILD/filebeat.tar.gz" \
    "https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-${BEATS_VERSION}-darwin-x86_64.tar.gz"
tar -xzf "$PKG_BUILD/filebeat.tar.gz" -C "$PKG_BUILD"
cp "$PKG_BUILD/filebeat-${BEATS_VERSION}-darwin-x86_64/filebeat" "$PKG_ROOT/bin/"

echo "Downloading Metricbeat from Elatic.co..."
curl -L -o "$PKG_BUILD/metricbeat.tar.gz" \
    "https://artifacts.elastic.co/downloads/beats/metricbeat/metricbeat-${BEATS_VERSION}-darwin-x86_64.tar.gz"
tar -xzf "$PKG_BUILD/metricbeat.tar.gz" -C "$PKG_BUILD"
cp "$PKG_BUILD/metricbeat-${BEATS_VERSION}-darwin-x86_64/metricbeat" "$PKG_ROOT/bin/"

# Build package
echo "Building MacOS morio package..."
pkgbuild --root "$PKG_ROOT" \
         --identifier com.morio.client \
         --version "$VERSION" \
         --install-location /opt/morio \
         --scripts "$PKG_ROOT/scripts" \
         "local/builds/morio-$VERSION.pkg"
