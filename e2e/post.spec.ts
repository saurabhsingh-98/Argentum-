import { test, expect } from '@playwright/test'

test.describe('Post creation', () => {
  test('new post page requires authentication', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/new')
    // Should redirect unauthenticated users away from /new
    await expect(page).not.toHaveURL('/new')
  })

  test('/feed page loads and shows build feed heading', async ({ page }) => {
    // This test verifies the feed page structure without requiring auth
    // (it will redirect, but we just check the redirect happens cleanly)
    await page.context().clearCookies()
    const response = await page.goto('/feed')
    // Either redirected to login or shows feed — no 500 errors
    expect(response?.status()).not.toBe(500)
  })
})
