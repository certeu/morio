module.exports = function (RED) {
  const https = require('https')
  const { URL } = require('url')

  function KVSetNode(n) {
    RED.nodes.createNode(this, n)

    /*
     * Store configuration
     */
    this.key = n.key
    this.val = n.val
    this.apikeyNode = RED.nodes.getNode(n.apikey)

    let status = 'Ready'
    /*
     * Validate required fields
     */
    if (!this.key) status = 'Ready (no static key)'
    // Note that false is a valid value
    if (!this.val) status = 'Ready (no static value)'
    if (!this.apikeyNode) {
      return this.status({ fill: 'red', shape: 'ring', text: 'API Key missing' })
    }
    if (!this.apikeyNode.credentials.apikey || !this.apikeyNode.credentials.apisecret) {
      return this.status({ fill: 'red', shape: 'ring', text: 'Invalid API Key' })
    }

    /*
     * Keep a handle on this for event handlers
     */
    const node = this

    /*
     * Set initial status
     */
    this.status({ fill: 'grey', shape: 'ring', text: status })

    /*
     * Handle incoming messages
     */
    this.on('input', function (msg, send, done) {
      node.handleInput(msg, send, done)
    })
  }

  /*
   * Input message handler
   */
  KVSetNode.prototype.handleInput = function (msg, send, done) {
    const node = this

    try {
      send = send || (() => this.send.apply(this, arguments))

      // Allow key to be overridden by msg.kvkey
      const key = msg?.kvkey || this.key
      const val = typeof msg?.kvval === 'undefined' ? this.val : msg.kvval
      if (!key) {
        const error = new Error('No key provided in config or message')
        if (done) done(error)
        else this.error(error)
        return
      }

      // Build the URL
      const url = new URL(`https://poc-morio-node1.cert.europa.eu/-/api/kv/keys/${key}`)

      // Prepare Basic Auth using credentials from config node
      const auth = Buffer.from(
        `${this.apikeyNode.credentials.apikey}:${this.apikeyNode.credentials.apisecret}`
      ).toString('base64')

      // Request body
      const body = JSON.stringify({ value: val })
      console.log({ body })

      // Request options
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'User-Agent': 'Node-RED KV Client',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        // Support self-signed certificates
        rejectUnauthorized: false,
      }

      this.status({ fill: 'blue', shape: 'ring', text: 'Sending...' })

      const req = https.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            // Try to parse as JSON, fallback to raw text
            let responseBody
            try {
              responseBody = JSON.parse(data)
            } catch (e) {
              responseBody = data
            }

            if (res.statusCode >= 200 && res.statusCode < 300) {
              // Success
              const outputMsg = {
                ...msg,
                payload: responseBody,
                statusCode: res.statusCode,
                headers: res.headers,
              }

              node.status({ fill: 'green', shape: 'dot', text: `Success (${res.statusCode})` })
              send(outputMsg)
              if (done) done()
            } else {
              // HTTP error status
              const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`)
              error.statusCode = res.statusCode
              error.responseBody = responseBody

              node.status({ fill: 'red', shape: 'ring', text: `Error ${res.statusCode}` })

              if (done) done(error)
              else node.error(error)
            }
          } catch (parseError) {
            node.status({ fill: 'red', shape: 'ring', text: 'Parse error' })
            if (done) done(parseError)
            else node.error(parseError)
          }
        })
      })

      req.on('error', (error) => {
        node.status({ fill: 'red', shape: 'ring', text: 'Request failed' })
        if (done) done(error)
        else node.error(error)
      })

      req.on('timeout', () => {
        req.destroy()
        const error = new Error('Request timeout')
        node.status({ fill: 'red', shape: 'ring', text: 'Timeout' })
        if (done) done(error)
        else node.error(error)
      })

      // Set timeout (30 seconds)
      req.setTimeout(30000)

      // Write the body and end the request
      req.write(body)
      req.end()
    } catch (ex) {
      this.status({ fill: 'red', shape: 'ring', text: 'Request error' })
      if (done) done(ex)
      else this.error(ex)
    }
  }

  RED.nodes.registerType('morio-kvset', KVSetNode)
}
