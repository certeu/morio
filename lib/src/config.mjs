/*
 * This file handles reading/writing configuration both for:
 *   - single node morio:  config is kept in files
 *   - clustered morio: config is kept in etcd
 */
import { readYamlFile } from './fs.mjs'

/**
 * Loads the morio configuration file from disk.
 *
 * How we handle configuration differs between single node to clustered instances.
 * So the very first thing to do is to load the `morio.yaml` file from disk and
 * figure out which scenario we are in.
 */
export const loadMorioConfig = async () => {
  const config = await readYamlFile('config/shared/morio.yaml')

  return config
}
