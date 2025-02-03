import valkey from 'ioredis'
import { config } from '../config/tap.mjs' // Needs to be mounted in the container

export const cache = new valkey({
  host: 'morio-cache',
  port: 6379,
  family: 4,
  connectionName: 'morio-tap',
  db: 0,
  tls: false,
})
