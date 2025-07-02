import valkey from 'ioredis'
import { config } from '../config/tap.mjs' // Needs to be mounted in the container

export const cache = new valkey(config.redis)
// Make sure it works
testCacheConnection()

async function testCacheConnection() {
  try {
    const result = await cache.ping()
    if (result === 'PONG') console.log('ValKey ping was a success')
    else console.log('Failed to ping ValKey, this is not a good omen')

    // Test basic operations
    await cache.set('test:key', 'test:value')
    const value = await cache.get('test:key')
    if (value === 'test:value') console.log('ValKey read/write operation confirmed')
    else console.log('Failed to read/write VakKey key, this will not end well')

    await cache.del('test:key')
    console.log('Cleaned up test keys, ValKey ready for Tap')
  } catch (error) {
    console.error('An error occured while cleaning the test key:', error)
  }
}
