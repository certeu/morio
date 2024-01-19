// Dependencies
import { template } from 'lib/utils.mjs'
import { atomWithLocation } from 'jotai-location'
import get from 'lodash.get'
// View confgurations
import core from 'config/config-wizard/core.yaml'
import connect from 'config/config-wizard/logstash.yaml'
import components from 'config/config-wizard/components.yaml'
// Component views
import ca from 'config/config-wizard/ca.yaml'

// Templates
import { templates } from './templates/index.mjs'

/*
 * Helper object with all imported view configurations
 */
const allViews = {
  core,
  connect,
  components: {
    ...components,
    children: {
      ca,
    },
  },
}

/*
 * Prepare views and keys structure
 */
export const views = {}
export const keys = {}
for (const [id, section] of Object.entries(allViews)) {
  keys[id] = id
  views[id] = { id, ...section }
  for (const cid in section.children) {
    keys[`${id}.${cid}`] = `${id}.children.${cid}`
    if (views[id].children[cid]) views[id].children[cid].id = `${id}.${cid}`
  }
}

/**
 * A helper function to resolve the next view from the views config
 *
 * @param {string} view - The current view
 * @param {object} config - The configuration from React state
 * @return {string} next - The resolve next value
 */
export const resolveNextView = (view, config) => {
  const next = get(getView(view), 'next', false)

  /*
   * If next holds an object with an if property, resolve the condition
   */
  if (next.if)
    return template(
      next.is === resolveViewValue(next.if, config, template) ? next.then : next.else,
      { CONFIG: config }
    )

  return next
}

/**
 * A helper method to resolve a value from the views config through templating
 * @param {string} input - The input to template
 * @param {object} config - The current config for use in templating
 * @return {string} val - The templated string
 *
 */
export const resolveViewValue = (input, config) => {
  let val = input
  if (typeof input === 'object') {
    val = template(input.val, { CONFIG: config })
    if (['number', 'string'].includes(input.as)) {
      if (input.as === 'number') val = Number(val)
      if (input.as === 'string') val = String(val)
    }
  } else val = template(input, { CONFIG: config })

  return val
}

/**
 * Helper method to load a view based on its id
 *
 * @param {string} id - The ID in dot notation
 * @return {object} view - The view configuration
 */
export const getView = (id) => get(views, keys[id])

/**
 * Keeps track of the view in the URL location
 */
export const viewInLocation = atomWithLocation()
