import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/auth\/login/)
    // The login page should have some form of sign-in UI
    await expect(page.locator('body')).toBeVisible()
  })

  test('unauthenticated user is redirected from /feed to login', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
    await page.goto('/feed')
    // Should redirect to login
    await expect(page).toHaveURL(/auth\/login/)
  })
})
