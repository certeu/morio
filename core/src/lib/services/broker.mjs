import { readYamlFile, writeYamlFile, writeFile } from '#shared/fs'

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
   * No config, generate configuration file and write it to disk
   */
  tools.log.debug('Storing inital broker configuration')
  await writeYamlFile(brokerConfigFile, tools.config.services.broker.broker, tools.log)
  await writeFile('/etc/morio/broker/tls-cert.pem', 'FIXME: TLS cert?')
  await writeFile('/etc/morio/broker/tls-key.pem', 'FIXME: TLS key?')
  await writeFile('/etc/morio/broker/tls-ca.pem', 'FIXME: TLS ca?')

  return tools
}
