import { iam } from './iam/index.mjs'
import { connector } from './connector/index.mjs'
import { deployment } from './deployment.mjs'
import { metadata } from './metadata.mjs'
import { tokens } from './tokens.mjs'

export const templates = {
  iam,
  connector,
  deployment,
  metadata,
  tokens,
}
