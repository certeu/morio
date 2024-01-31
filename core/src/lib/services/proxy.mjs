import { readFile, writeFile } from '#shared/fs'

/*
 * Before creating the container, update the entrypoint
 * shell script with our own one.
 * This will be volume-mapped, so we need to write it to
 * disk first so it's available
 */
export const preCreate = async (tools, recreate) => {
  /*
   * See if entrypoint.sh on the host OS is our custom version
   */
  let file = '/etc/morio/proxy/entrypoint.sh'
  const entrypoint = await readFile(file)
  if (entrypoint && entrypoint.includes('update-ca-certificates')) {
    tools.log.debug('Proxy: Custom entrypoint exists, no action needed')
  } else {
    tools.log.debug('Proxy: Creating custom entrypoint')
    await writeFile(
      file,
      tools.config.services.proxy.entrypoint,
      tools.log,
      0o755
    )
  }

  /*
   * See if root certificate exists, create empty file if not
   * This is required because the root certificate is bind-mounted
   * in the proxy container. However, the file won't exist on the
   * host OS until the CA is started. So when Morio runs in
   * ephemeral mode, there is no CA, and Docker will (when a
   * bind mounted file does not exist) create a folder (instead
   * of a file) with this name.
   * Long story short, all will break unless we make sure there
   * is a file in place that can be overwritten later.
   */
  file = '/morio/data/ca/certs/root_ca.crt'
  const ca = await readFile(file)
  if (ca) {
    tools.log.debug('Proxy: Root certificate file exists, no action needed')
  } else  {
    tools.log.debug('Proxy: Creating placeholder root certificate file')
    await writeFile(
      file,
      '',
      tools.log,
      0o755
    )
  }
}


/**
 * Returns an array populated with Traefik routers that are
 * configured on a container via labels.
 *
 * @param {object} srvConf - The service configuration
 * @return {array} routers - The list of routers
 */
const getTraefikRouters = (srvConf) => {
  /*
   * Don't bother if there's no (traefik) labels on the container
   */
  if (!srvConf.container?.labels) return []

  const routers = new Set()
  for (const label of srvConf.container.labels) {
    const chunks = label.split('.')
    /*
     * Note that we are only checking for HTTP routers (for now)
     */
    if (chunks[0] === 'traefik' && chunks[1] === 'http' && chunks[2] === 'routers')
      routers.add(chunks[3])
  }

  return [...routers]
}

/**
 * Adds/Adapts container labels to configure TLS on Traefik
 *
 * @param {object} srvConf - The service configuration
 * @param {object} tools - The tools object
 * @return {object} srvconf - The updated service configuration
 */
export const addTraefikTlsConfiguration = (srvConf, tools) => {
  /*
   * Don't bother if we are running in ephemeral mode
   */
  if (tools.info.ephemeral) return srvConf

  /*
   * Add default cert to router
   */
  for (const router of getTraefikRouters(srvConf)) {
    srvConf.container.labels.push(
      `traefik.http.routers.${router}.tls.certresolver=ca`,
      `traefik.tls.stores.default.defaultgeneratedcert.resolver=ca`,
      `traefik.tls.stores.default.defaultgeneratedcert.domain.main=${tools.config.deployment.nodes[0]}`,
      `traefik.tls.stores.default.defaultgeneratedcert.domain.sans=${tools.config.deployment.nodes.join(', ')}`
    )
  }
  /*
   * Update rule with hostname(s)
   * FIXME: This does not yet support clustering
   */
  for (const i in srvConf.container?.labels || []) {
    if (srvConf.container.labels[i].toLowerCase().indexOf('rule=(') !== -1) {
      const chunks = srvConf.container.labels[i].split('rule=(')
      srvConf.container.labels[i] =
        chunks[0] +
        'rule=(Host(' +
        tools.config.deployment.nodes.map((node) => `\`${node}\``).join(',') +
        ')) && (' +
        chunks[1]
    }
  }

  return srvConf
}
