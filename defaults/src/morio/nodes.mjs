/*
 * Minimum number of Morio nodes
 */
export const MORIO_NODES_MIN = 1

/*
 * Maximum number of Morio nodes in a cluster
 */
export const MORIO_NODES_MAX = 15

/*
 * These are amounts of cluster nodes we support
 */
export const MORIO_NODES_VALID = [1, 3, 5, 7, 9, 11, 13, 15]

/*
 * Combined named export
 */
export const nodes = {
  MORIO_NODES_MIN,
  MORIO_NODES_MAX,
  MORIO_NODES_VALID,
}
