/*
 * Eslint does not support import assertions because they only
 * support stage-4 language features.
 *
 * It's annoying and can't be disabled. So instead this file
 * will import all JSON and you can then import it from here.
 *
 * This way, we just ignore this file in eslint and voila.
 */
import dockerAllContainersExample from './docker-all-containers.json' assert { type: 'json' }
import dockerRunningContainersExample from './docker-running-containers.json' assert { type: 'json' }
import dockerDfExample from './docker-df.json' assert { type: 'json' }
import dockerInfoExample from './docker-info.json' assert { type: 'json' }
import dockerImagesExample from './docker-images.json' assert { type: 'json' }
import dockerNetworksExample from './docker-networks.json' assert { type: 'json' }


export {
  dockerAllContainersExample,
  dockerRunningContainersExample,
  dockerDfExample,
  dockerInfoExample,
  dockerImagesExample,
  dockerNetworksExample,
}

