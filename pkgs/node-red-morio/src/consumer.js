module.exports = function (RED) {
  const utils = require('./utils.js')

  function MorioConsumerNode(n) {
    RED.nodes.createNode(this, n)

    /*
     * Don't bother without a broker client
     */
    const broker = RED.nodes.getNode(n.broker)
    if (!broker) return this.status({ fill: 'red', shape: 'ring', text: 'No broker client provided' })
    else this.broker = broker

    /*
     * Don't bother without a topic
     */
    const topic = RED.nodes.getNode(n.topic)
    if (!topic) return this.status({ fill: 'red', shape: 'ring', text: 'No topic provided' })
    else this.topic = topic

    /*
     * Store settings and other things we need for use in prototype
     */
    this.settings = {
      consumer: { groupId: n.groupId || 'no_group_id' },
      topic: topic.topic
    }

    /*
     * Keep a handle on this
     */
    const node = this
    this.messageHandler = {
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = {
            topic,
            partition,
            data: utils.parseKafkaMessage(message)
          }

          node.send({ topic, partition, data })
          node.status({ fill: 'green', shape: 'dot', text: 'Received message' })
        } catch (err) {
          node.onError('Morio consumer error during message processing', err)
          node.status({ fill: 'red', shape: 'ring', text: 'Message processing error' })
        }
      },
    }

    /*
     * Initialize the Morio consumer
     */
    this.init()
      .catch((e) => {
        node.status({ fill: 'red', shape: 'ring', text: 'Consumer startup error' })
        node.error('Morio consumer startup error', e)
      })

    /*
     * Shut down Kafka connection gracefully on close
     */
    node.on('close', function (done) {
      node.consumer
        .disconnect()
        .then(() => {
          node.status({ fill: 'grey', shape: 'ring', text: 'Disconnected' })
          if (done) done()
        })
        .catch(err => done ? done(err) : node.onError(err))
    })
  }

  /*
   * These prototype methods are shared across all Morio consumer instances
   */
  // Connection handler
  MorioConsumerNode.prototype.onConnect = function () {
    this.status({ fill: 'green', shape: 'ring', text: 'Connected' })
  }
  // Disconnection handler
  MorioConsumerNode.prototype.onDisconnect = function () {
    this.status({ fill: 'red', shape: 'ring', text: 'Disconnected' })
  }
  // Request timeout handler
  MorioConsumerNode.prototype.onRequestTimeout = function () {
    this.error('Kafka Consumer Timeout')
    this.status({ fill: 'red', shape: 'ring', text: 'Request timed out' })
  }
  // Error handler
  MorioConsumerNode.prototype.onError = function (message, ex) {
    this.error(message || 'Kafka Consumer Error', ex)
    this.status({ fill: 'red', shape: 'ring', text: 'Consumer error' })
  }
  // Initializer
  MorioConsumerNode.prototype.init = async function () {
    this.consumer = this.broker.server.consumer(this.settings.consumer)
    this.status({ fill: 'yellow', shape: 'ring', text: 'Starting consumer...' })

    const { CONNECT, DISCONNECT, REQUEST_TIMEOUT } = this.consumer.events

    /*
     * Bind event handlers to maintain the context of this
     */
    this.consumer.on(CONNECT, this.onConnect.bind(this))
    this.consumer.on(DISCONNECT, this.onDisconnect.bind(this))
    this.consumer.on(REQUEST_TIMEOUT, this.onRequestTimeout.bind(this))

    await this.consumer.connect()
    await this.consumer.subscribe({ topic: this.settings.topic })
    await this.consumer.run(this.createRunHandler())
  }
  // Factory method for the incoming message handler
  MorioConsumerNode.prototype.createRunHandler = function() {
    const self = this
    return {
      eachMessage: async ({ topic, partition, message }) => {
        try {
          self.send({ payload: { topic, partition, payload: utils.parseKafkaMessage(message) } })
          self.status({ fill: 'green', shape: 'dot', text: 'Message received' })
        } catch (err) {
          self.onError('Morio consumer error during message processing', err)
          self.status({ fill: 'red', shape: 'ring', text: 'Message processing error' })
        }
      }
    }
  }
  /*
   * Last but not least, register the node type
   */
  RED.nodes.registerType('morio-consumer', MorioConsumerNode)
}
