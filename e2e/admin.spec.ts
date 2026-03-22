import { test, expect } from '@playwright/test'

test.describe('Admin panel access control', () => {
  test('non-admin user cannot access admin panel', async ({ page }) => {
    await page.context().clearCookies()
    // The admin route segment is obfuscated; attempt to access the public /admin redirect
    const response = await page.goto('/admin')
    // Should either 404 or redirect away — never show admin content to unauthenticated users
    const status = response?.status()
    const url = page.url()
    // Either redirected to login or got a 404 — not a 200 with admin content
    const isRedirectedToLogin = url.includes('/auth/login')
    const isNotFound = status === 404
    expect(isRedirectedToLogin || isNotFound).toBeTruthy()
  })
})
