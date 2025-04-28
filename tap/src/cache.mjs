import valkey from 'ioredis'
import { config } from '../config/tap.mjs' // Needs to be mounted in the container

export const cache = new valkey(config.redis)
