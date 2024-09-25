import { expect } from '@playwright/test'

/*
 * These are the ephemeral UI tests
 */
const tests = {
  'First test': async ({ page }) => {
    await page.goto('/')

    /*
     * Metadata
     */
    await expect(page).toHaveTitle('Morio: Welcome to morio')
  },
}

export default tests
