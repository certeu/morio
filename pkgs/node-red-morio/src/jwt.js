/*
 * This adds a Node-RED node that will fetch a
 * custom JWT token from the Morio API.
 */
module.exports = function (RED) {
  const utils = require('./utils.js')

  function JwtNode(n) {
    try {
      RED.nodes.createNode(this, n)

      /*
       * Grab settings provided by core
       */
      const settings = utils.loadSettings()

      /*
       * Store configuration
       */
      this.settings = { api: settings.api }

      /*
       * Keep a handle on this for event handlers
       */
      const self = this

      /*
       * Set initial status
       */
      this.status({ fill: 'grey', shape: 'ring', text: 'Ready' })

      /*
       * Handle incoming messages
       */
      this.on('input', function (msg, send, done) {
        self.handleInput(msg, send, done)
      })
    } catch (error) {
      console.error('JWT Node Constructor Error:', error)
      throw error
    }
  }

  /*
   * Input message handler
   */
  JwtNode.prototype.handleInput = function (msg, send, done) {
    const self = this

    /*
     * Request a JWT token from the Morio API
     */
    fetch(`${self.settings?.api || 'http://morio-api:3000'}/token/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        node: {
          id: self.id,
          type: self.type,
          z: self.z,
          name: self.name,
        },
        msg,
      }),
    })
      .then((response) => {
        response
          .json()
          .then((data) => {
            if (data.jwt) {
              self.status({ fill: 'green', shape: 'dot', text: `JWT Loaded` })
              send({
                ...msg,
                payload: {
                  jwt: data.jwt,
                  bearer: `Bearer ${data.jwt}`,
                  headers: {
                    Authorization: `Bearer ${data.jwt}`,
                  },
                },
              })
            } else {
              self.status({ fill: 'red', shape: 'dot', text: `Failed` })
            }

            if (done) done()
          })
          .catch((err) => console.log(err))
      })
      .catch((err) => console.log(err))
  }

  RED.nodes.registerType('morio-jwt', JwtNode)
}
