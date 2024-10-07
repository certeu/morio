#!/usr/bin/env bash
#
#    _ _ _  ___  _ _  _  ___
#   | ' ' |/ . \| '_/| |/ . \
#   |_|_|_|\___/|_|  |_|\___/
#
#   https://morio.it
#   https://{{ MORIO_CLUSTER_FQDN }}
#
#   This install script will setup the Morio client.
#   It will:
#     - Make sure systemd is available
#     - Detect whether it is a APT or RPM bacsed system
#     - Setup the morio repository
#     - Update dependencies
#     - Install the morio package
#
#   This install script is tied to the Morio instance at:
#   https://{{ MORIO_CLUSTER_FQDN }}
#
#   To learn more about Morio, visit https://morio.it
#

#
# Store the package format
#
PACKAGE_FORMAT=""
PACKAGE_EXT=""

#
# Detect if the system is APT-based (Debian/Ubuntu) or RPM-based (RHEL/RockyLinux/Fedora)
#
detect_package_manager() {
  echo ""
  echo -n "ðŸ”Ž Looking for apt or yum..."
  if command -v apt-get &> /dev/null; then
    echo -ne "\râœ… Found apt, will use the APT repository."
    PACKAGE_FORMAT="apt"
    PACKAGE_EXT="deb"
  elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
    echo -ne "\râœ… Found yum, will use the RPM repository."
    PACKAGE_FORMAT="rpm"
    PACKAGE_EXT="rpm"
  else
    echo -ne "\râŒ Failed to find either apt or yum. Not sure what that means, so bailing out here."
    exit 1
  fi
}

#
# Detect systemd
#
detect_systemd() {
  echo ""
  echo -n "ðŸ”Ž Looking for systemd..."
  if pidof systemd &> /dev/null; then
    echo -ne "\râœ… Found systemd               "
  else
    echo -ne "\râŒ Failed to find systemd"
    echo "Morio requires systemd for automated installation."
    echo "You can install Morio manually on systems without systemd."
    echo "Refer to https://morio.it/docs/guides/install for details."
    exit 1
  fi
}

#
# This function will download the morio-repo installer package
#
download_repo_pkg() {
  local url="$1"
  local output="$2"
  echo ""

  # Use curl if it's available
  if command -v curl &> /dev/null; then
    echo -n "â¬‡ï¸  Downloading morio repo package with curl"
    curl -kfsSL "$url" -o "$output"
  # Use wget if curl is not available
  elif command -v wget &> /dev/null; then
    echo -n "â¬‡ï¸  Downloading morio repo package with wget"
    wget -q --no-check-certificate "$url" -O "$output"
  # Without curl or wget, bail
  else
    echo "âš ï¸  No curl found, and no wget found. We need a way to download the morio repo package."
    echo ""
    echo "ðŸ’¡ Consider installing curl with:"
    if [ $PACKAGE_FORMAT == "apt" ]; then
      echo "  sudo apt install -y curl"
    else
      echo "  sudo yum install -y curl"
    fi
    echo "ðŸ’¡ Then run this script again."
    return 1
  fi

  # Make sure the download is ok
  if [ -f "$output" ]; then
    echo -ne "\râœ… Download completed: $url"
  else
    echo -ne "\râŒ Failed to download $url"
    return 1
  fi
}

#
# This function will install the repo package
#
install_repo_pkg() {
  echo ""
  echo "ðŸ“¦ Installing morio repo, which will add the ${PACKAGE_FORMAT} repository..."
  if [ $PACKAGE_FORMAT == "apt" ]; then
    sudo DEBIAN_FRONTEND=noninteractive apt install -y /tmp/setup-moriod-repo.${PACKAGE_EXT}
  else
    sudo yum install -y /tmp/setup-moriod-repo.${PACKAGE_EXT}
    echo ""
    echo "ðŸ›¢ï¸ Updating list of available packages..."
    sudo yum clean expire-cache && sudo yum check-update
  fi
}

#
# This function will install the morio package
#
install_morio_pkg() {
  echo ""
  echo "ðŸ“¦ Installing the Morio client..."
  if [ $PACKAGE_FORMAT == "apt" ]; then
    sudo DEBIAN_FRONTEND=noninteractive apt install -y morio
  else
    sudo yum install -y morio
  fi
}

#
# Main install function that does what needs doing
install() {
  echo "    _ _ _  ___  _ _  _  ___ "
  echo "   | ' ' |/ . \| '_/| |/ . \ "
  echo "   |_|_|_|\___/|_|  |_|\___/ "
  detect_systemd
  detect_package_manager
  download_repo_pkg \
    https://{{ MORIO_CLUSTER_FQDN }}/downloads/morio-repo.${PACKAGE_EXT} \
    /tmp/setup-morio-repo.${PACKAGE_EXT}
  install_repo_pkg
  install_morio_pkg
  sudo morio start
}

#
# Run the install function
#
install
