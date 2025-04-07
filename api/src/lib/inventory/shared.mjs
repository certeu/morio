/**
 * Adds a non-enumerable property to an object
 *
 * @private
 * @param {Object} obj - The object to add the property to
 * @param {string} name - The name of the property
 * @param {mixed} value - The value of the property
 * @return {object} obj - The mutated object
 */
export function addNonEnumProp(obj, name, value) {
  Object.defineProperty(obj, name, {
    enumerable: false,
    configurable: false,
    writable: true,
    value,
  })

  return obj
}

/**
 * Helper method to parse results into an array of objects
 */
export function resultsAsList(result) {
  const cols = result?.results?.[0]?.columns
  const values = result?.results?.[0]?.values
  const list = (result?.results?.[0]?.values || []).map((entry) => {
    const host = {}
    for (const i in cols)
      host[cols[i]] =
        values[cols[i]] && typeof values[cols[i]] === 'function'
          ? values[cols[i]](entry[i])
          : entry[i]

    return host
  })

  return list
}

/**
 * Helper method to parse result into an objects
 */
export function resultAsRecord(result) {
  const list = resultsAsList(result)

  return list.pop()
}
