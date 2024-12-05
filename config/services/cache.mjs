/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'valkey/valkey',
  // Image tag (version) to run
  tag: '8.0.1',
}

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  return {
    container: {
      ...pullConfig,
      // Name to use for the running container
      container_name: 'cache',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports
      ports: [ ],
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/valkey:/usr/local/etc/valkey`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/valkey:/usr/local/etc/valkey`,
          ],
    },
    /*
     * Valkey configuration file
     */
    valkey: `# Valkey configuration for Morio
# See: https://raw.githubusercontent.com/valkey-io/valkey/8.0/valkey.conf

#
# Listen on all interfaces
#
bind 0.0.0.0

#
# ValKey is not exposed, but we still run in protected mode
#
protected-mode yes

#
# Do not allow commands that will mutate the config or files on disk
#
enable-protected-configs no
enable-debug-command no
enable-module-command no

#
# Listen on the default ValKey port
#
port ${utils.getPreset('MORIO_CACHE_PORT')}

#
# Do not force close idle client connections
#
timeout 0

#
# Keep client connections alive
#
tcp-keepalive 300

#
# Use a single database
#
databases 1

#
# Log user data to facilitate troubleshooting
#
hide-user-data-from-log no

#
# Do not muck about with the process info
#
set-proc-title no

#
# Do not save data to disk, remain ephemeral
#
save ""

#
# Keep maximum clients to something reasonable
#
maxclients: 64

#
# Max memory limit
# Typically set in settings as x GB where x defauilts to 1
#
maxmemory ${utils.getSettings('cache.maxmemory', 1)}gb

#
# Eviction policy
# We opt for volatile-lfu here, which means that:
# - Only keys with an expiry will be evicted
# - The keys that are the least frequently used (LFU) are the first to be evicted
#
maxmemory-policy volatile-lfu

`,
  }
}

