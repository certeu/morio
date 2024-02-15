/**
 * A helper method to turn a wizard url into a settings path
 *
 * Eg: Turns core.node_count into `${prefix}/core/node_count`
 *
 * @param {string} url
 */
export const viewAsSettingsPath = (view, prefix) =>
  view
    ? view
        .slice(prefix.length + 1)
        .split('/')
        .join('.')
    : prefix

/**
 * A helper method to turn a settings key into a wizard url
 *
 * Eg: Turns `${prefix}/core/node_count` into core.node_count
 */
export const settingsPathAsView = (path, prefix) =>
  path ? prefix + '/' + path.split('.').join('/') : prefix
