import { readYamlFile, writeYamlFile, chown, mkdir } from '#shared/fs'

export const wanted = () => false

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'connector',
  hooks: {
    wanted: (tools) => {
      if (tools.config?.connector?.pipelines) {
        if (
          Object.values(tools.config.connector.pipelines).filter((pipe) => !pipe.disabled).length >
          0
        )
          return true
      }

      return false
    },
    /*
     * Before creating the container, write out the logstash.yml file
     * This will be volume-mapped, so we need to write it to
     * disk first so it's available
     */
    preCreate: async (tools) => {
      /*
       * See if logstash.yml on the host OS is present
       */
      const file = '/etc/morio/connector/config/logstash.yml'
      const config = await readYamlFile(file)
      if (config) {
        tools.log.debug('Connector: Config file exists, no action needed')
      } else {
        tools.log.debug('Connector: Creating config file')
        await writeYamlFile(file, tools.config.services.connector.logstash, tools.log, 0o644)
      }

      /*
       * Make sure the data directory exists, and is writable
       */
      const uid = tools.getPreset('MORIO_CONNECTOR_UID')
      await mkdir('/morio/data/connector')
      await chown('/morio/data/connector', uid, uid)

      return true
    },
  },
}
