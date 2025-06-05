/*
 * This adds a Node-RED config node that holds
 * a broker client. Essentially a pre-configured
 * KafkaJS instance.
 */
module.exports = function (RED) {
  const utils = require('./utils.js')
  const { Kafka } = require('kafkajs')

  function MorioBrokerClientNode(n) {
    try {
      RED.nodes.createNode(this, n)
      const settings = utils.loadSettings()
      const node = this
      node.options = {
        ...settings.broker,
        clientId: n.clientId,
      }
      node.server = new Kafka(node.options)
    } catch (error) {
      console.error('Morio Broker Contrusture Error:', error)
      throw error
    }
  }
  RED.nodes.registerType('morio-broker-client', MorioBrokerClientNode)
}
