#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Enter client source folder
cd $MORIO_GIT_ROOT/client

echo "Building Morio client:"

# Build for linux
echo " 1/5 Linux on amd64..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-linux-amd64
echo " 2/5 Linux on arm64..."
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-linux-arm64

# Build for macos
echo " 3/5 MacOS on amd64..."
echo "(skipped - not implemented yet)"
#CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-macos-amd64
echo " 4/5 MacOS on arm64..."
echo "(skipped - not implemented yet)"
#CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-macos-arm64

# Build for Windows
echo " 5/5 Windows on amd64..."
echo "(skipped - not implemented yet)"
#CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-windows-amd64

# Copy linux/amd64 client in place, it's the only one we ship for now
cp ../local/builds/morio-linux-amd64 ../pkgs/morio-client/linux/usr/sbin/morio
