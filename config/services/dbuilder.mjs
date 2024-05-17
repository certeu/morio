/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = (store) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = store.inProduction()
  const DIRS = {
    data: store.getPreset('MORIO_DATA_ROOT'),
    dl: store.getPreset('MORIO_DOWNLOADS_FOLDER'),
    repo: store.getPreset('MORIO_REPO_ROOT'),
  }

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'dbuilder',
      // Image to run (different in dev)
      image: 'morio/dbuilder',
      // Image tag (version) to run
      tag: store.getPreset('MORIO_VERSION'),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: store.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [
            `${DIRS.data}/clients/linux:/morio/src`,
            `${DIRS.data}/${DIRS.dl}/clients/deb:/morio/dist`,
          ]
        : [
            `${DIRS.repo}/data/data/clients/linux:/morio/src`,
            `${DIRS.repo}/data/data/${DIRS.dl}/clients/deb:/morio/dist`,
          ],
      // Don't keep container after it exits
      ephemeral: true,
    },
  }
}

/*
 * These are the defaults that will be used to build the DEB package.
 * You can override them by passing them in to the control method.
 */
export const defaults = {
  Package: 'morio-client',
  Source: 'morio-client',
  Section: 'utils',
  Priority: 'optional',
  Architecture: 'amd64',
  Essential: 'no',
  Depends: [
    ['auditbeat', '>= 8.12'],
    ['filebeat', '>= 8.12'],
    ['metricbeat', '>= 8.12'],
  ],
  'Installed-Size': 5000,
  Maintainer: 'CERT-EU <services@cert.europa.eu>',
  'Changed-By': 'Joost De Cock <joost.decock@cert.europa.eu>',
  Uploaders: ['Joost De Cock <joost.decock@cert.europa.eu>'],
  Homepage: 'https://github.com/certeu/morio',
  Description: `The Morio client collects and ships observability data to a Morio instance.`,
  DetailedDescription: `Deploy this Morio client (based on Elastic Beats) on your endpoints,
and collect their data on one or more centralized Morio instances
for analysis, further processing, downstream routing & filtering,
or event-driven automation.`,
  'Vcs-Git': 'https://github.com/certeu/morio -b main [clients/linux]',
}

/**
 * This generated a control file to build DEB packages.
 *
 * @param {object} settigns - Specific settings to build this package
 * @return {string} controlFile - The control file contents
 */
export const resolveControlFile = (settings = {}) => {
  const s = {
    ...defaults,
    ...settings,
  }

  /*
   * Add revision to version number (if there is one)
   */
  if (settings.Revision) {
    s.Version += `-${s.Revision}`
    delete s.Revision
  }

  /*
   * Construct more complex fields
   */
  const extra = [`Depends: ` + s.Depends.map((pkg) => `${pkg[0]} (${pkg[1]})`).join(', ')]
  delete s.Depends
  if (s.Uploaders.length > 0) extra.push(`Uploaders: ` + s.Uploaders.join(', '))
  delete s.Uploaders
  s.Description += '\n  ' + s.DetailedDescription.split('\n').join('\n  ')
  delete s.DetailedDescription

  /*
   * Return control file structure/contents
   */
  return {
    control: [...Object.keys(s).map((key) => `${key}: ${s[key]}`), ...extra, ''].join('\n'),
    settings: s,
  }
}
