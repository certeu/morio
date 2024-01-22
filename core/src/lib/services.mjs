import { resolveServiceConfiguration } from '#config'
import {
  docker,
  createDockerContainer,
  runDockerApiCommand,
  runContainerApiCommand,
  generateContainerConfig,
} from '#lib/docker'

/**
 * Creates (a container for) a morio service
 *
 * @param {string} name = Name of the service
 * @param {object} tools = The tools object
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createMorioService = async (name, tools) => {
  /*
   * Generate container config to pass to the Docker API
   */
  const srvConf = resolveServiceConfig(name, tools)
  tools.config.services[name] = srvConf
  const cntConf = generateContainerConfig(srvConf, tools)

  /*
   * It's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages', {}, tools)
  if (!ok) tools.log.warn('Unable to load list of docker images')
  if (list.filter((img) => img.RepoTags.includes(cntConf.Image)).length < 1) {
    tools.log.info(`Image ${cntConf.Image} is not available locally. Attempting pull.`)

    return new Promise((resolve) => {
      docker.pull(cntConf.Image, (err, stream) => {
        docker.modem.followProgress(stream, onFinished)
        async function onFinished() {
          tools.log.debug(`Image pulled: ${cntConf.Image}`)
          const id = await createDockerContainer(name, cntConf, tools)
          resolve(id)
        }
      })
    })
  } else return await createDockerContainer(name, cntConf, tools)
}

const getTraefikRouters = (config) => {
  /*
   * Don't bother if there's no (traefik) labels on the container
   */
  if (!config.container?.labels) return []

  const routers = new Set()
  for (const label of config.container.labels) {
    const chunks = label.split('.')
    /*
     * Note that we are only checking for HTTP routers (for now)
     */
    if (chunks[0] === 'traefik' && chunks[1] === 'http' && chunks[2] === 'routers')
      routers.add(chunks[3])
  }

  return [...routers]
}

const addTraefikTlsConfiguration = (srvConf, tools) => {
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

/**
 * Helper method to resolve a service configuration file
 *
 * This calls resolveServiceConfiguration, and for services that are
 * exposed via Traefik does some more config rewriting to add TLS settings.
 *
 * @param {string} name - Name of the service
 * @param {object} tools - The tools object
 * @return {object} obj - The resolved config
 */
export const resolveServiceConfig = (name, tools) =>
  ['api', 'ca', 'console', 'ui', 'proxy'].includes(name)
    ? addTraefikTlsConfiguration(resolveServiceConfiguration(name, tools), tools)
    : resolveServiceConfiguration(name, tools)

/**
 * Starts a morio service
 *
 * @param {string} containerId = The container ID
 * @param {string} name = The service name
 * @param {object} tools = The tools object
 * @return {bool} ok = Whether or not the service was started
 */
export const startMorioService = async (containerId, name, tools) => {
  const [ok, started] = await runContainerApiCommand(containerId, 'start', {}, tools)

  if (ok) tools.log.info(`Service started: ${name}`)
  else tools.log.warn(started, `Failed to start ${name}`)

  return ok
}
