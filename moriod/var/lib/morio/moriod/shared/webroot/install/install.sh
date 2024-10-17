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
# Some basic text styling
#
bold=$(tput bold)
normal=$(tput sgr0)

#
# Show the steps to take
#
show_steps() {
  echo "This script will install the Morio client for the collector at:"
  echo "  {{ MORIO_CLUSTER_FQDN }}"
  echo "It will take the following steps:"
  echo ""
  echo "  -  ${bold}Download${normal} the ${bold}morio-repo${normal} package from the Morio collector"
  echo "  -  ${bold}Install${normal} this package, which will:"
  echo "    -  Set up the ${bold}Morio software repository${normal} (hosted on the collector)"
  echo "    -  Set up the ${bold}Elastic software repository${normal} (hosted by Elastic, needed for dependencies)"
  echo "    -  Add the collector's ${bold}Root Certificate${normal} as a trusted certificate authority"
  echo "  -  ${bold}Install${normal} the ${bold}morio-client${normal} package which will:"
  echo "    -  ${bold}Install dependencies${normal} (the Beats agents from Elastic)"
  echo "    -  Create a ${bold}systemd unit file${normal} for the various agents"
}

#
# Shows the help
#
show_help() {
  show_steps
  echo ""
  echo "Usage:"
  echo "  install.sh [options]"
  echo ""
  echo "Options:"
  echo "  -h    Display this help message"
  echo "  -y    Answers Yes to the prompt (fully automated install)"
  echo ""
  echo "Examples:"
  echo "  Install the Morio client (prompts for confirmation):"
  echo "    ./install.sh"
  echo ""
  echo "  Install the Morio client (fully automated):"
  echo "    ./install.sh -y"
  echo ""

  exit 0
}

show_postinstall_help() {
  clear
  echo ""
  echo "Congratulations, the Morio client is now installed on this system 🎉"
  echo ""
  echo "Run ${bold}sudo morio init${normal} to get started with the next steps"
  echo "or learn about all available options with: ${bold}sudo morio help${normal}"
  echo ""
  echo "The full Morio documentation is available at: ${bold}https://morio.it/docs/guides/client${normal}"
  echo ""
}

#
# Detect if the system is APT-based (Debian/Ubuntu) or RPM-based (RHEL/RockyLinux/Fedora)
#
detect_package_manager() {
  echo ""
  echo -n "🔎  Looking for apt or yum..."
  if command -v apt-get &> /dev/null; then
    echo -ne "\r✅  Found apt, will use the APT repository."
    PACKAGE_FORMAT="apt"
    PACKAGE_EXT="deb"
  elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
    echo -ne "\r✅  Found yum, will use the RPM repository."
    PACKAGE_FORMAT="rpm"
    PACKAGE_EXT="rpm"
  else
    echo -ne "\r❌  Failed to find either apt or yum. Not sure what that means, so bailing out here."
    exit 1
  fi
}

#
# Detect systemd
#
detect_systemd() {
  echo ""
  echo -n "🔎  Looking for systemd..."
  if pidof systemd &> /dev/null; then
    echo -ne "\r✅  Found systemd               "
  else
    echo -ne "\r❌  Failed to find systemd"
    echo "The Morio client requires systemd for automated installation."
    echo "You can install the Morio client manually on systems without systemd."
    echo "Refer to https://morio.it/docs/guides/install-clients for details."
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
    echo -n "⬇️  Downloading morio repo package with curl"
    curl -kfsSL "$url" -o "$output"
  # Use wget if curl is not available
  elif command -v wget &> /dev/null; then
    echo -n "⬇️  Downloading morio repo package with wget"
    wget -q --no-check-certificate "$url" -O "$output"
  # Without curl or wget, bail
  else
    echo "⚠️  No curl found, and no wget found. We need a way to download the morio repo package."
    echo ""
    echo "💡  Consider installing curl with:"
    if [ $PACKAGE_FORMAT == "apt" ]; then
      echo "  sudo apt install -y curl"
    else
      echo "  sudo yum install -y curl"
    fi
    echo "💡  Then run this script again."
    return 1
  fi

  # Make sure the download is ok
  if [ -f "$output" ]; then
    echo -ne "\r✅  Download completed: $url"
  else
    echo -ne "\r❌  Failed to download $url"
    return 1
  fi
}

#
# This function will install the repo package
#
install_repo_pkg() {
  echo ""
  echo "📦  Installing morio repo, which will add the ${PACKAGE_FORMAT} repository..."
  if [ $PACKAGE_FORMAT == "apt" ]; then
    sudo DEBIAN_FRONTEND=noninteractive apt install -y /tmp/setup-morio-repo.${PACKAGE_EXT}
    sudo apt update
  else
    sudo yum install -y /tmp/setup-morio-repo.${PACKAGE_EXT}
    echo ""
    echo "🛢️  Updating list of available packages..."
    sudo yum clean expire-cache && sudo yum check-update
  fi
}

#
# This function will install the morio package
#
install_morio_pkg() {
  echo ""
  echo "📦  Installing the Morio client..."
  if [ $PACKAGE_FORMAT == "apt" ]; then
    sudo DEBIAN_FRONTEND=noninteractive apt install -y morio-client
  else
    sudo yum install -y morio-client
  fi
}

#
# Main install function that does what needs doing
#
install() {
  local MODE=$1

  if [ $MODE != "auto" ]; then
    echo "    _ _ _  ___  _ _  _  ___ "
    echo "   | ' ' |/ . \| '_/| |/ . \ "
    echo "   |_|_|_|\___/|_|  |_|\___/ "
    echo " "
    show_steps
    echo " "
    read -p "Do you want to continue with these steps? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
      echo ""
      echo "Exiting installer."
      exit 0
    fi
  fi
  detect_systemd
  detect_package_manager
  download_repo_pkg \
    https://{{ MORIO_CLUSTER_FQDN }}/repos/${PACKAGE_FORMAT}/latest/morio-repo.${PACKAGE_EXT} \
    /tmp/setup-morio-repo.${PACKAGE_EXT}
  install_repo_pkg
  install_morio_pkg
  show_postinstall_help
}

#
# Parse command-line options
#
while [[ $# -gt 0 ]]; do
  case $1 in
    -h)
      show_help
      exit 0
      ;;
    -y)
      install "confirm"
      exit 0
      ;;
    -n)
      install "auto"
      exit 0
      ;;
  esac
  shift
done

#
# If no options were provided, show the default install
#
if [ $# -eq 0 ]; then
  install "confirm"
fi

