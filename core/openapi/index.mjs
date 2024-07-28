import { getPreset } from '#config'
import { OpenAPI } from '#shared/openapi'
import { utils } from '../src/lib/utils.mjs'
//import { paths as setup } from './setup.mjs'
//import { paths as status } from './status.mjs'
//import { paths as validate } from './validate.mjs'
//import { paths as docker } from './docker.mjs'

const api = new OpenAPI(utils, 'core')


  //app.post('/cluster/heartbeat', (req, res) => Cluster.heartbeat(req, res))
  //app.post('/cluster/sync', (req, res) => Cluster.sync(req, res))
  //app.post('/cluster/elect', (req, res) => Cluster.elect(req, res))
  //app.post('/cluster/join', (req, res) => Cluster.join(req, res))


export const spec = api.spec
