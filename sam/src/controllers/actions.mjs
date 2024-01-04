/**
 * This actions controller handles actions
 *
 * @returns {object} Controller - The actions controller object
 */
export function Controller() {}

/**
 * Deploy a new configuration
 *
 * This will write the new config to disk and restart Morio
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deploy = async (req, res) => {
  return res.send({
    fixme: 'This is a deploy test',
  })
}
