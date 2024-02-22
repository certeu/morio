import { readYamlFile, writeYamlFile, writeFile, chown, mkdir } from '#shared/fs'
import { attempt } from '#shared/utils'
import { createX509Certificate } from './core.mjs'
import { execContainerCommand } from '#lib/docker'
import { testUrl } from '#shared/network'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'broker',
  hooks: {
    wanted: (tools) => (tools.info.ephemeral ? false : true),
    preStart: async (tools) => {
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
       * Broker is not initialized, we need to get a certitificate,
       * but 9 tiumes out of 10, this means the CA has just been starte
       * by core. So let's give it 6.66 seconds to come up
       */
      //tools.log.debug('Sleeping 6.66 seconds before requesting broker certificate from CA (so it can come up)')
      //await sleep(6.66)
      //tools.log.debug('Woke up after 6.66 seconds, requesting broker certificate')

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
      const uid = tools.getPreset('MORIO_BROKER_UID')
      tools.log.debug('Storing inital broker configuration')
      await writeYamlFile(brokerConfigFile, tools.config.services.broker.broker, tools.log)
      await chown(brokerConfigFile, uid, uid)
      await writeFile('/etc/morio/broker/tls-cert.pem', certAndKey.certificate.crt)
      await chown('/etc/morio/broker/tls-cert.pem', uid, uid)
      await writeFile('/etc/morio/broker/tls-key.pem', certAndKey.key)
      await chown('/etc/morio/broker/tls-key.pem', uid, uid)
      await writeFile('/etc/morio/broker/tls-ca.pem', certAndKey.certificate.certChain)
      await chown('/etc/morio/broker/tls-ca.pem', uid, uid)
      await chown('/etc/morio/broker', uid, uid)
      await mkdir('/morio/data/broker')
      await chown('/morio/data/broker', uid, uid)

      return tools
    },
    postStart: async (tools) => {
      /*
       * Make sure broker is up
       */
      const up = await attempt({
        every: 2,
        timeout: 60,
        run: async () => await isBrokerUp(tools),
        onFailedAttempt: (s) =>
          tools.log.debug(`Waited ${s} seconds for broker, will continue waiting.`),
      })
      if (up) tools.log.debug(`Broker is up.`)
      else {
        tools.log.warn(`Broker did not come up before timeout. Not creating topics.`)
        return
      }

      /*
       * Ensure topics exist
       */
      await ensureTopicsExist(tools)

      return true
    },
  },
}

const ensureTopicsExist = async (tools) => {
  const topics = await getTopics(tools)

  for (const topic of tools
    .getPreset('MORIO_BROKER_TOPICS')
    .filter((topic) => !topics.includes(topic))) {
    tools.log.debug(`Topic ${topic} not present, creating now.`)
    await execContainerCommand('broker', ['rpk', 'topic', 'create', topic], null, tools)
  }
}

/**
 * This method checks whether or not the broker is up
 *
 * @param {object} tools - The tools object
 * @return {bool} result - True if the broker is up, false if not
 */
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

/**
 * Get the list of topics from RedPanda
 *
 * @param {object} tools - The tools object
 * @return {object} result - The JSON output as a POJO
 */
const getTopics = async (tools) => {
  const result = await testUrl(`http://broker_${tools.config.core.node_nr}:8082/topics`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })

  return result
}
