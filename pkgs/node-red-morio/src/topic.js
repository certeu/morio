module.exports = function (RED) {
  function MorioTopicNode(n) {
    RED.nodes.createNode(this, n)
    this.topic = n.topic || 'events'
  }
  RED.nodes.registerType('morio-topic', MorioTopicNode)
}
