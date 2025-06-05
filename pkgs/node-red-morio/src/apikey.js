/*
 * This adds a Node-RED config node that holds a Morio API Key
 */
module.exports = function (RED) {
  function MorioApikeyNode(n) {
    RED.nodes.createNode(this, n)
    this.name = n.name
  }

  RED.nodes.registerType('morio-apikey', MorioApikeyNode, {
    credentials: {
      apikey: { type: 'text' },
      apisecret: { type: 'password' },
    },
  })
}
