/*
 * This adds a Node-RED config node that holds a Morio API Key
 */
module.exports = function (RED) {
  function MorioApikeyNode(n) {
    RED.nodes.createNode(this, n)
    this.name = n.name
    this.apikey = n.apikey
    this.apisecret = n.apisecret
  }

  RED.nodes.registerType('morio-apikey', MorioApikeyNode, {
    apikey: { type: 'text' },
    apisecret: { type: 'password' }
  })
}
