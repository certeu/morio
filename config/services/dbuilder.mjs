/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()
  const DIRS = {
    data: utils.getPreset('MORIO_DATA_ROOT'),
    dl: utils.getPreset('MORIO_DOWNLOADS_FOLDER'),
    repo: utils.getPreset('MORIO_GIT_ROOT'),
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
      image: 'itsmorio/dbuilder',
      // Image tag (version) to run
      tag: utils.getPreset('MORIO_VERSION_TAG'),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [
            `${DIRS.data}/clients:/morio/client/bin`,
            `${DIRS.data}/clients/linux:/morio/client/src`,
            `${DIRS.data}/${DIRS.dl}/clients/deb:/morio/client/dist`,
            `${DIRS.data}/installers/deb:/morio/repo/src`,
            `${DIRS.data}/${DIRS.dl}/installers/deb:/morio/repo/dist`,
            `${DIRS.data}/aptly:/repo`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/dbuilder:/etc/dbuilder`,
          ]
        : [
            `${DIRS.repo}/clients:/morio/client/bin`,
            `${DIRS.repo}/data/data/clients/linux:/morio/client/src`,
            `${DIRS.repo}/data/data/${DIRS.dl}/clients/deb:/morio/client/dist`,
            `${DIRS.repo}/data/data/installers/deb:/morio/repo/src`,
            `${DIRS.repo}/data/data/${DIRS.dl}/installers/deb:/morio/repo/dist`,
            `${DIRS.repo}/data/data/aptly:/repo`,
            `${DIRS.repo}/data/config/dbuilder:/etc/dbuilder`,
          ],
      // Don't keep container after it exits
      ephemeral: true,
    }
  }
}

/*
 * These are the defaults that will be used to build the DEB client package.
 * You can override them by passing them in to the control method.
 */
export const clientDefaults = {
  Package: 'morio-client',
  Source: 'morio-client',
  Section: 'utils',
  Priority: 'optional',
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
  Architecture: '__MORIO_CLIENT_ARCHITECTURE__' // This will be replaced by the builder
}

export const clientDefaultsYouCanEdit = [
  'Depends',
  'Installed-Size',
  'Maintainer',
  'Changed-By',
  'Uploaders',
  'Homepage',
  'Description',
  'DetailedDescription',
  'Vcs-Git',
]

/*
 * These are the defaults that will be used to build the DEB client package.
 * You can override them by passing them in to the control method.
 */
export const repoDefaults = {
  Package: 'morio-repo',
  Source: 'morio-repo',
  Section: 'misc',
  Priority: 'optional',
  Architecture: 'all',
  Essential: 'no',
  Depends: [ ['apt-transport-https', '>=2'] ],
  'Installed-Size': 50000,
  Maintainer: 'CERT-EU <services@cert.europa.eu>',
  'Changed-By': 'Joost De Cock <joost.decock@cert.europa.eu>',
  Homepage: 'https://morio.it',
  Description: `Adds Morio repository and GPG key`,
  'Vcs-Git': 'https://github.com/certeu/morio -b main',
  Uploaders: ['Joost De Cock <joost.decock@cert.europa.eu>'],
  DetailedDescription: `Install this package to set up the apt
repository on your Morio collector. This allows you to install the
Morio client and its updates via the OS package manager.`
}

/**
 * This generated a control file to build a DEB package.
 *
 * @param {object} settigns - Specific settings to build this package
 * @param {object} utils - The utils object from core
 * @param {string} type - The package to build (repo or client)
 * @return {string} controlFile - The control file contents
 */
export const resolveControlFile = (settings = {}, utils, type='client') => {
  const s = type === 'repo'
    ? { ...repoDefaults, ...settings }
    : { ...clientDefaults, ...settings }

  /*
   * If no version is specified, use the Morio version
   */
  if (!s.Version) s.Version = utils.getVersion()

  /*
   * Add revision to version number
   */
  if (settings.Revision) {
    s.Version += `-${s.Revision}`
    delete s.Revision
  }
  else s.Version += `-0`

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
  return [...Object.keys(s).map((key) => `${key}: ${s[key]}`), ...extra, ''].join('\n')
}


