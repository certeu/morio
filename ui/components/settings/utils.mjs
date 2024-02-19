/**
 * A helper method to turn a wizard url into a section path
 *
 * Eg: Turns core.node_count into `${prefix}/core/node_count`
 *
 * @param {string} url
 */
export const viewAsSectionPath = (view, prefix) =>
  view
    ? view
        .slice(prefix.length + 1)
        .split('/')
        .filter((el) => el.length > 0)
        .join('.')
    : prefix

/**
 * A helper method to turn a settings key into a wizard url
 *
 * Eg: Turns `${prefix}/core/node_count` into core.node_count
 */
export const sectionPathAsView = (path, prefix) =>
  path ? prefix + '/' + path.split('.').join('/') : prefix
