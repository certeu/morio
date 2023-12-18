import { capitalize } from '@morio/lib/utils'

/*
 * Import the docker controller
 */
import { Controller } from '../controllers/docker.mjs'

/*
 * Instantiate the controller
 */
const Docker = new Controller()

/**
 * This method adds the docker routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * API routes for the root Docker API
   */
  app.get(`/docker/:cmd`, (req, res) => Docker.dockerGetCmd(req, res, tools))
  app.post(`/docker/:cmd`, (req, res) => Docker[`${type}PostCmd`](req, res, tools))
  app.put(`/docker/:cmd`, (req, res) => Docker[`${type}PutCmd`](req, res, tools))
  app.delete(`/docker/:cmd`, (req, res) => Docker[`${type}DeleteCmd`](req, res, tools))

  /*
   * API routes for nested Docker API endpoints
   */
  for (const type of ['swarm', 'image', 'images', 'builder', 'volumes', 'networks']) {
    app.get(`/docker/${type}/:cmd`, (req, res) => Docker[`${type}NestedGetCmd`](req, res, tools))
    app.post(`/docker/${type}/:cmd`, (req, res) => Docker[`${type}NestedPostCmd`](req, res, tools))
  }

  /*
   * API routes for specific Docker resources
   */
  for (const type of [
    'container',
    'image',
    'network',
    'node',
    'secret',
    'service',
    'task',
    'volume',
  ]) {
    app.get(`/docker/${type}/:id/:cmd`, (req, res) => Docker[`${type}GetCmd`](req, res, tools))
    app.post(`/docker/${type}/:id/:cmd`, (req, res) => Docker[`${type}PostCmd`](req, res, tools))
    app.put(`/docker/${type}/:id/:cmd`, (req, res) => Docker[`${type}PutCmd`](req, res, tools))
    app.delete(`/docker/${type}/:id/:cmd`, (req, res) =>
      Docker[`${type}DeleteCmd`](req, res, tools)
    )
  }
}
