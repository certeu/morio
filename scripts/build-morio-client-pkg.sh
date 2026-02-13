#!/bin/bash
set -e

# Versions
VERSION=$(cat ./VERSION | xargs)
BEATS_VERSION=9.3.0

# Directories
PKG_ROOT="./local/builds/macos/src"
PKG_BUILD="./local/builds/macos/build"
PKG_SRC="./pkgs/morio-client/macos"

# Clean and create directories
rm -rf "$PKG_ROOT"
rm -rf "$PKG_BUILD"
mkdir -p "$PKG_ROOT/bin"
mkdir -p "$PKG_BUILD"

# Copy package source files
cp -R $PKG_SRC/* $PKG_ROOT

# Copy the morio binary (we assume it was pre-built)
cp $PKG_ROOT/../../morio-macos-arm64 $PKG_ROOT/bin/morio

# Download and extract Elastic beats
echo "Downloading Auditbeat from elastic.co..."
curl -L -o "$PKG_BUILD/auditbeat.tar.gz" \
    "https://artifacts.elastic.co/downloads/beats/auditbeat/auditbeat-${BEATS_VERSION}-darwin-aarch64.tar.gz"
tar -xzf "$PKG_BUILD/auditbeat.tar.gz" -C "$PKG_BUILD"
cp "$PKG_BUILD/auditbeat-${BEATS_VERSION}-darwin-aarch64/auditbeat" "$PKG_ROOT/bin/"

echo "Downloading Filebeat from elastic.co..."
curl -L -o "$PKG_BUILD/filebeat.tar.gz" \
    "https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-${BEATS_VERSION}-darwin-aarch64.tar.gz"
tar -xzf "$PKG_BUILD/filebeat.tar.gz" -C "$PKG_BUILD"
cp "$PKG_BUILD/filebeat-${BEATS_VERSION}-darwin-aarch64/filebeat" "$PKG_ROOT/bin/"

echo "Downloading Metricbeat from elastic.co..."
curl -L -o "$PKG_BUILD/metricbeat.tar.gz" \
    "https://artifacts.elastic.co/downloads/beats/metricbeat/metricbeat-${BEATS_VERSION}-darwin-aarch64.tar.gz"
tar -xzf "$PKG_BUILD/metricbeat.tar.gz" -C "$PKG_BUILD"
cp "$PKG_BUILD/metricbeat-${BEATS_VERSION}-darwin-aarch64/metricbeat" "$PKG_ROOT/bin/"

# Build package
echo "Building MacOS morio package..."
pkgbuild --root "$PKG_ROOT" \
         --identifier com.morio.client \
         --version "$VERSION" \
         --install-location /opt/morio \
         --scripts "$PKG_ROOT/scripts" \
         "local/builds/morio-$VERSION.pkg"
