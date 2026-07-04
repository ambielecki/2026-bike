import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Track every mountain bike route worth riding twice.')
  await expect(page.getByText('Save routes that matter')).toBeVisible()
})
