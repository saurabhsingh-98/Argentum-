// Feature: argentum-refinements, Property 10: Message Formatting Completeness
import { describe, it, expect } from 'vitest'
import { formatRelativeTime } from '../utils/time'

describe('formatRelativeTime', () => {
  it('returns "Just now" for dates within the last minute', () => {
    const recent = new Date(Date.now() - 30 * 1000)
    expect(formatRelativeTime(recent)).toBe('Just now')
  })

  it('returns minutes ago for dates within the last hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago for dates within the last day', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago')
  })

  it('returns "Yesterday at ..." for dates from yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(10, 30, 0, 0)
    const result = formatRelativeTime(yesterday)
    expect(result).toMatch(/^Yesterday at/)
  })

  it('returns "Never" for null input', () => {
    expect(formatRelativeTime(null)).toBe('Never')
  })

  it('handles string date input', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    expect(formatRelativeTime(tenMinAgo)).toBe('10m ago')
  })
})
