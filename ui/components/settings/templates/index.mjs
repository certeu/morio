import { iam } from './iam/index.mjs'
import { connector } from './connector/index.mjs'
import { cluster } from './cluster.mjs'
import { tap } from './tap.mjs'
import { tokens } from './tokens.mjs'
//import { watcher } from './watcher.mjs'

export const templates = {
  cluster,
  iam,
  connector,
  //watcher,
  tap,
  tokens,
}
