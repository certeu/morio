import { deployment } from './deployment.mjs'
import { connector } from './connector/index.mjs'
import { metadata } from './metadata.mjs'
import { tokens } from './tokens.mjs'

export const templates = {
  connector,
  deployment,
  metadata,
  tokens,
}
