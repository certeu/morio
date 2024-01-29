import { readYamlFile, writeYamlFile, writeFile, chown } from '#shared/fs'
import { createX509Certificate } from './core.mjs'

export const bootstrap = async (tools) => {
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
