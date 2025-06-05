/*
 * This adds a Node-RED config node that holds a Morio Broker topic
 */
module.exports = function (RED) {
  function MorioTopicNode(n) {
    RED.nodes.createNode(this, n)
    this.topic = n.topic || 'events'
  }
  RED.nodes.registerType('morio-topic', MorioTopicNode)
}
