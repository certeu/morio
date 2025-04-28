import { iam } from './iam/index.mjs'
import { connector } from './connector/index.mjs'
import { cluster } from './cluster.mjs'
import { flanking } from './flanking.mjs'
import { tap } from './tap.mjs'
import { tokens } from './tokens.mjs'
//import { watcher } from './watcher.mjs'

/*
 * Note that this also controls the order in which they appear
 */
export const templates = {
  cluster,
  flanking,
  iam,
  connector,
  //watcher,
  tap,
  tokens,
}
