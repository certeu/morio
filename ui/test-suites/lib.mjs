import { test } from '@playwright/test'

/*
 * Helper method to run a bunch of tests
 */
export const runTests = (obj) => {
  for (const [name, method] of Object.entries(obj)) test(name, method)
}
