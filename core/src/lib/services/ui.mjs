/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'ui',
  hooks: {
    recreateContainer: () => false,
    restartContainer: (running, recreate) => {
      if (recreate) return true
      if (!running.ui) return true

      return false
    },
  },
}
