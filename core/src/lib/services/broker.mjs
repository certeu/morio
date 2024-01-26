import { readYamlFile, writeYamlFile, writeFile } from '#shared/fs'
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
  tools.log.debug('Storing inital broker configuration')
  await writeYamlFile(brokerConfigFile, tools.config.services.broker.broker, tools.log)
  await writeFile('/etc/morio/broker/tls-cert.pem', certAndKey.certificate.crt)
  await writeFile('/etc/morio/broker/tls-key.pem', certAndKey.key)
  await writeFile('/etc/morio/broker/tls-ca.pem', certAndKey.certificate.certChain)

  return tools
}
