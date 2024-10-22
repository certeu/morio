#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Enter client source folder
cd $MORIO_GIT_ROOT/clients/morio

echo "Building Morio client:"

# Build for linux
echo " 1/5 Linux on amd64..."
GOOS=linux GOARCH=amd64 go build -o ../morio-linux-amd64
echo " 2/5 Linux on arm64..."
GOOS=linux GOARCH=arm64 go build -o ../morio-linux-arm64

# Build for macos
echo " 3/5 MacOS on amd64..."
GOOS=darwin GOARCH=amd64 go build -o ../morio-macos-amd64
echo " 4/5 MacOS on arm64..."
GOOS=darwin GOARCH=arm64 go build -o ../morio-macos-arm64

# Build for Windows
echo " 5/5 Windows on amd64..."
GOOS=windows GOARCH=amd64 go build -o ../morio-windows-amd64

# Copy client builds to their location

