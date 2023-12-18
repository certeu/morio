import { routes as actions } from './actions.mjs'
import { routes as docker } from './docker.mjs'
import { routes as status } from './status.mjs'

export const routes = {
  actions,
  docker,
  status,
}
