import { readYamlFile, writeYamlFile } from '@morio/shared/fs'
import pkg from '../package.json' assert { type: 'json' }

/*
 * Load config we need
 */
const config = {
  api: await readYamlFile('config/api.yaml', console.log),
  compose: await readYamlFile('config/compose.yaml', console.log),
  sam: await readYamlFile('config/sam.yaml', console.log),
  traefik: await readYamlFile('config/traefik.yaml', console.log),
}

/*
 * Generate compose file for development
 */
await writeYamlFile('compose/dev.yaml', {
  version: config.compose.version,
  name: pkg.name,
  services: {
    api: {
      ...config.api.container,
      image: `${config.api.container.image}:${pkg.version}`,
    },
    sam: {
      ...config.sam.container,
      image: `${config.sam.container.image}:${pkg.version}`,
    },
    traefik: config.traefik.container,
  },
  networks: {
    default: {
      name: 'morio_net',
    },
  },
})
