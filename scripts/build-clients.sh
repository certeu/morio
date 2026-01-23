#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Enter client source folder
cd $MORIO_GIT_ROOT/client

echo "Building Morio client:"

# Build for Linux
echo " 1/4 Linux on amd64..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-linux-amd64
echo " 2/4 Linux on arm64..."
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-linux-arm64

# Build for MacOS
echo " 3/4 MacOS on arm64..."
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-macos-arm64

# Build for Windows (no beats for windows on arm)
echo " 4/4 Windows on amd64..."
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-windows-amd64.exe
# Is there a use case to support Windows on ARM?
#CGO_ENABLED=0 GOOS=windows GOARCH=arm64 go build -a -ldflags '-extldflags "-static"' -o ../local/builds/morio-windows-amd64.exe

# Copy linux/amd64 client in place (arm is not handled for now)
cp ../local/builds/morio-linux-amd64 ../pkgs/morio-client/linux/usr/sbin/morio

# Copy macos/arm64 client in place
cp ../local/builds/morio-macos-arm64 ../pkgs/morio-client/macos/bin/morio

# Copy windows/amd64 client in place
cp ../local/builds/morio-windows-amd64.exe ../pkgs/morio-client/windows/bin/morio.exe

