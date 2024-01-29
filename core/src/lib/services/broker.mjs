import { readYamlFile, writeYamlFile, writeFile, chown } from '#shared/fs'
import { createX509Certificate } from './core.mjs'
import { execContainerCommand } from '#lib/docker'
import { testUrl } from '#shared/network'

export const preStart = async (tools) => {
  // Don't repeat yourself
  const brokerConfigFile = `/etc/morio/broker/redpanda.yaml`

  /*
   * We'll check if there's a broker config file on disk
   * If so, RedPanda has already been initialized
   */
  const bootstrapped = await readYamlFile(brokerConfigFile)

  /*
   * If the broker is initialized, return early
   */
  if (bootstrapped) return tools

  /*
   * It is not, generate X.509 certificate/key for the broker(s)
   */
  const certAndKey = await createX509Certificate(tools, {
    certificate: {
      cn: 'Morio Broker',
      c: tools.getPreset('MORIO_X509_C'),
      st: tools.getPreset('MORIO_X509_ST'),
      l: tools.getPreset('MORIO_X509_L'),
      o: tools.getPreset('MORIO_X509_O'),
      ou: tools.getPreset('MORIO_X509_OU'),
      san: tools.config.deployment.nodes,
    },
    notAfter: tools.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
  })

  /*
   * No config, generate configuration file and write it to disk
   */
  // 101 is the UID that redpanda runs under inside the container
  const uid = 101
  tools.log.debug('Storing inital broker configuration')
  await writeYamlFile(brokerConfigFile, tools.config.services.broker.broker, tools.log)
  await chown(brokerConfigFile, uid, uid)
  await writeFile('/etc/morio/broker/tls-cert.pem', certAndKey.certificate.crt)
  await chown('/etc/morio/broker/tls-cert.pem', uid, uid)
  await writeFile('/etc/morio/broker/tls-key.pem', certAndKey.key)
  await chown('/etc/morio/broker/tls-key.pem', uid, uid)
  await writeFile('/etc/morio/broker/tls-ca.pem', certAndKey.certificate.certChain)
  await chown('/etc/morio/broker/tls-ca.pem', uid, uid)

  return tools
}

export const postStart = async (tools) => {
  /*
   * Make sure broker is up
   */
  const up = await waitForBroker(tools)
  if (up) tools.log.debug(`Broker is up.`)
  else {
    tools.log.warn(`Broker did not come up before timeout. Not creating topics.`)
    return
  }

  /*
   * Ensure topics exist
   */
  await ensureTopicsExist(tools)

  return
}

const ensureTopicsExist = async (tools) => {
  const topics = await getTopics(tools)

  for (const topic of tools
    .getPreset('MORIO_BROKER_TOPICS')
    .filter((topic) => !topics.includes(topic))) {
    tools.log.debug(`Topic ${topic} not present, creating now.`)
    const result = await execContainerCommand(
      'broker',
      ['rpk', 'topic', 'create', topic],
      (err, output) => tools.log.debug({ err, output }),
      tools
    )
    tools.log.debug({ result })
  }
}

/*
 * This method waits for a broker to come up
 */
const waitForBroker = async (tools, timeout = 60) =>
  new Promise((resolve) => isBrokerUpPromiseResolver(tools, timeout, resolve))

/*
 * Promise resolver functions should not be async
 * so this method is here to side-step that
 */
const isBrokerUpPromiseResolver = async (tools, timeout, resolve) => {
  /*
   * Quick check to see if it's already up
   */
  let up = await isBrokerUp(tools)
  if (up) return resolve(true)

  /*
   * It's not up (yet), so keep trying until timeout
   */
  const now = Date.now()
  const interval = setInterval(async () => {
    const result = await isBrokerUp(tools)
    if (result) {
      clearInterval(interval)
      return resolve(true)
    } else {
      const delta = (Date.now() - now) / 1000
      if (delta > timeout) {
        tools.log.warn(`Waited more than ${Math.floor(timeout)}s for broker to come up. Giving up.`)
        return resolve(false)
      } else
        tools.log.debug(
          `Waited ${Math.floor(delta)}s for broker to come up, will wait a bit longer.`
        )
    }
  }, 2000)
}

const isBrokerUp = async (tools) => {
  const result = await testUrl(
    `http://broker_${tools.config.core.node_nr}:9644/v1/cluster/health_overview`,
    {
      ignoreCertificate: true,
      returnAs: 'json',
    }
  )
  if (result && result.is_healthy) return true

  return false
}

const getTopics = async (tools) => {
  const result = await testUrl(`http://broker_${tools.config.core.node_nr}:8082/topics`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })

  return result
}
