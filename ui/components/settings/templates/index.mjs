import { iam } from './iam/index.mjs'
import { connector } from './connector/index.mjs'
import { cluster } from './cluster.mjs'
import { metadata } from './metadata.mjs'
import { tokens } from './tokens.mjs'

export const templates = {
  cluster,
  iam,
  connector,
  tokens,
  metadata,
}
