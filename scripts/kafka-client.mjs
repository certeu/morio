import { Kafka, logLevel } from 'kafkajs'
import { readJsonFile, readYamlFile, globDir } from '../shared/src/fs.mjs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { MORIO_GIT_ROOT } from '../config/cli.mjs'
import axios from 'axios'
import https from 'https'
import prettyjson from 'prettyjson'

/*
 * Figure out whether we are called from the CLI
 */
const scriptLocation = resolve(fileURLToPath(import.meta.url))
const nodeArg = resolve(process.argv[1])
const onCli = scriptLocation.includes(nodeArg)

/*
 * If so, get to work
 */
if (onCli) {
  if (typeof process.argv[2] !== 'string') {
    showHelp()
    process.exit()
  }

  /*
   * Set up logging method
   */
  const log = process.argv[3] === 'pretty'
    ? (data, br=false) => {
      if (br) {
        console.log()
        console.log(`-------------------------------- ${data.partition} / ${data.offset} --------------------------------`)
        console.log()
        console.log(prettyjson.render(data.value))
      }
      else console.log(prettyjson.render(typeof data === 'string' ? { msg: data } : data ))
    }
    : (data) => console.log(JSON.stringify(typeof data === 'string' ? { msg: data } : data ))

  /*
   * Load settings from disk
   */
  log('Loading settings...')
  const settings = await loadSettings()
  if (!settings) log('Failed to load settings')

  /*
   * Load keys from disk
   */
  log('Loading keys...')
  const keys = await loadKeys()
  if (!keys) log('Failed to load keys')

  /*
   * Load certificate from API
   */
  log('Requesting certificate...')
  const x509 = await loadCertificate({
    node: settings?.cluster?.broker_nodes?.[0],
    mrt: keys?.mrt,
    ca: keys?.rcrt
  })
  if (!x509) log('Failed to load certificate')

  /*
   * Do not continue if we do not have what it takes
   */
  if (!settings || !keys || !x509) process.exit(1)

  /*
   * Instantiate Kafka client
   */
  const clientId = 'morio-dev-client'
  const ssl = {
    rejectUnauthorized: false,
    ca: keys.rcrt,
    key: x509.key,
    cert: x509.certificate.crt,
  }
  const client = new Kafka({
    clientId,
    brokers: settings.cluster.broker_nodes.map(broker => `${broker}:9092`),
    ssl,
    logLevel: logLevel.ERROR,
  })

  /*
   * Attach a consumer & connect
   */
  const consumer = client.consumer({ groupId: clientId })
  await consumer.connect()
  log(`Subscribing to ${process.argv[2]} topic...`)
  await consumer.subscribe({ topic: process.argv[2], fromBeginning: true })
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      log({
        partition,
        offset: message.offset,
        value: JSON.parse(message.value.toString()),
      }, true)
    },
  })

  /*
   * Set up event listener for CONNECT event
   */
  consumer.on(consumer.events.CONNECT, () => {
    log('Kafka consumer connected')
  })

  /*
   * Set up event listener for DISCONNECT event
   */
  consumer.on(consumer.events.DISCONNECT, () => {
    log('Kafka consumer disconnected')
  })

  /*
   * Handle exit gracefully
   */
  process.on('SIGINT', async function() {
    console.log()
    console.log()
    log('Exiting, closing connnection...')
    try {
      await consumer.disconnect()
    }
    catch (err) {
      // Do we care?
    }
    finally {
      log('All done. Bye!')
      process.exit(0)
    }
  })
}



/*
 * To make sure this 'just works' we load the MRT straight from disk.
 * We use it to load the settings, and a certificate for mTLS.
 */
async function loadKeys () {
  return await readJsonFile(`${MORIO_GIT_ROOT}/data/config/keys.json`)
}

/*
 * To make sure this 'just works' we load the settings from disk.
 */
async function loadSettings () {
  const files = await globDir(`${MORIO_GIT_ROOT}/data/config`, 'settings.*.yaml')

  if (Array.isArray(files) && files.length > 0) return await readYamlFile(files.sort().pop())

  return false
}

async function loadCertificate ({ node, mrt, ca }) {
  const httpsAgent = new https.Agent({ ca })
  let result
  try {
    result = await axios.post(
      `https://${node}/-/api/ca/certificate`,
      {
        certificate: {
          cn: "Morio dev kafka client",
          c: "BE",
          st: "Antwerp",
          l: "Antwerp",
          o: "SoJoMo",
          ou: "Jo",
          san: [ 'dev.clients.morio.sojomo.co' ],
        }
      },
      {
        auth: {
          username: 'root',
          password: mrt
        },
        httpsAgent,
      }
    )
  }
  catch (err) {
    return false
  }

  return result.data
}

function showHelp() {
    console.log(`
Usage:

  node ./scripts/kafka-client.mjs topic

Where 'topic' is the name of a Kafka topic to follow.
`)
}

