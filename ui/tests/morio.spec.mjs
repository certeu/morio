import { test, expect } from '@playwright/test'

/*
 * This is just an example, we are not going to test morio.it
 */
test('has title', async ({ page }) => {
  await page.goto('https://morio.it/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Morio/)
})

test('get started link', async ({ page }) => {
  await page.goto('https://morio.it/')

  // Click the get started link.
  await page.getByRole('link', { name: 'Reference' }).click()

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Reference' })).toBeVisible()
})
