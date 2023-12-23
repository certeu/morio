export const capitalize = (string) =>
  typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : ''

export const asPojo = (obj) => JSON.parse(JSON.stringify(obj))
