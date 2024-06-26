import { Kafka, logLevel } from 'kafkajs'

export function KafkaClient(store) {
  /*
   * This ID tells the client apart in a clustered Morio deployment
   */
  this.id = `api-${store.config.core.node_nr}`

  /*
   * Attach the client
   */
  this.client = new Kafka({
    clientId: this.id,
    brokers: store.config.deployment.nodes.map((node, i) => `broker_${Number(i) + 1}:9092`),
    logLevel: logLevel.ERROR,
  })

  /*
   * Attach a producer
   */
  this.producer = this.client.producer()

  /*
   * Attach a consumer
   */
  this.consumer = this.client.consumer({ groupId: this.id })

  /*
   * Add connect method
   */
  this.connect = async function () {
    await this.producer.connect()
    await this.consumer.connect()
  }

  /*
   * Add disconnect method
   */
  this.disconnect = async function () {
    await this.producer.disconnect()
    await this.consumer.disconnect()
  }

  /*
   * Return client
   */

  return this
}
