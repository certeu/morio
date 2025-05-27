module.exports = function (RED) {
  const utils = require('./utils.js')

  function MorioProducerNode(n) {
    RED.nodes.createNode(this, n)

    /*
     * Don't bother without a broker client
     */
    const broker = RED.nodes.getNode(n.broker)
    if (!broker) return this.status({ fill: 'red', shape: 'ring', text: 'Broker is missing.' })

    /*
     * Store settings and state
     */
    this.broker = broker
    this.ready = false
    this.producer = null
    this.topic = n.topic

    /*
     * Keep a handle on this for event handlers
     */
    const node = this

    /*
     * Initialize the Morio producer
     */
    this.init()
      .catch(e => {
        node.status({ fill: 'red', shape: 'ring', text: 'Producer startup error' })
        node.error('Morio producer startup error', e)
      })

    /*
     * Handle incoming messages
     */
    this.on('input', function (msg, send, done) {
      node.handleInput(msg, send, done)
    })

    /*
     * Shut down Kafka connection gracefully on close
     */
    this.on('close', function (removed, done) {
      node.handleClose(removed, done)
    })
  }

  /*
   * These prototype methods are shared across all Morio producer instances
   */

  // Connection handler
  MorioProducerNode.prototype.onConnect = function () {
    this.ready = true
    this.status({ fill: 'green', shape: 'ring', text: 'Connected' })
  }

  // Disconnection handler
  MorioProducerNode.prototype.onDisconnect = function () {
    this.ready = false
    this.status({ fill: 'red', shape: 'ring', text: 'Disconnected' })
  }

  // Request timeout handler
  MorioProducerNode.prototype.onRequestTimeout = function () {
    this.status({ fill: 'red', shape: 'ring', text: 'Request timed out' })
  }

  // Error handler
  MorioProducerNode.prototype.onError = function (message, ex) {
    this.error(message || 'Kafka Producer Error', ex)
    this.status({ fill: 'red', shape: 'ring', text: 'Producer error' })
  }

  // Initializer
  MorioProducerNode.prototype.init = async function () {
    this.producer = this.broker.server.producer({ allowTopicCreation: true })
    this.status({ fill: 'yellow', shape: 'ring', text: 'Starting producer...' })

    const { CONNECT, DISCONNECT, REQUEST_TIMEOUT } = this.producer.events

    /*
     * Bind event handlers to maintain the context of this
     */
    this.producer.on(CONNECT, this.onConnect.bind(this))
    this.producer.on(DISCONNECT, this.onDisconnect.bind(this))
    this.producer.on(REQUEST_TIMEOUT, this.onRequestTimeout.bind(this))

    await this.producer.connect()
  }

  // Input message handler
  MorioProducerNode.prototype.handleInput = function (msg, send, done) {
    if (!this.ready || !msg.payload) return

    try {
      send = send || (() => this.send.apply(this, arguments))

      this.producer
        .send({
          topic: this.topic,
          acks: 1,
          messages: [
            {
              key: Date.now(),
              value: utils.prepareKafkaData(msg.payload)
            },
          ],
        })
        .then(() => {
          this.status({ fill: 'green', shape: 'dot', text: 'Message sent' })
          send([msg, null])

          if (done) done()
        })
        .catch((err) => {
          this.status({ fill: 'red', shape: 'ring', text: 'Producer sending error' })
          send([null, { ...msg, error: err }])

          done
            ? done(err)
            : this.error(err, 'Morio producer error')
        })

      this.status({ fill: 'blue', shape: 'ring', text: 'Sending message' })
    }
    catch (ex) {
      this.status({ fill: 'red', shape: 'ring', text: 'Message sending error' })
      send([null, { ...msg, error: ex }])

      done
        ? done(ex)
        : this.error(ex, 'Morio producer error')
    }
  }

  // Close handler
  MorioProducerNode.prototype.handleClose = function (removed, done) {
    done = typeof done === 'function' ? done : typeof removed === 'function' ? removed : null

    this.producer &&
    this.producer
      .disconnect()
      .then(() => {
        this.status({ fill: 'grey', shape: 'ring', text: 'Disconnected' })
        if (done) done()
      })
      .catch(err => done ? done(err) : this.onError('Broker disconnect error', err))
  }

  /*
   * Register the node type
   */
  RED.nodes.registerType('morio-producer', MorioProducerNode)
}
