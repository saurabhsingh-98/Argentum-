import { describe, it, expect } from 'vitest'
import { calculateStreak } from '../utils/streak'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

describe('calculateStreak', () => {
  it('returns 0 for empty history', () => {
    const result = calculateStreak([])
    expect(result.current).toBe(0)
    expect(result.longest).toBe(0)
  })

  it('returns streak of 1 for a single post today', () => {
    const result = calculateStreak([{ post_date: daysAgo(0) }])
    expect(result.current).toBe(1)
    expect(result.longest).toBe(1)
  })

  it('counts consecutive days correctly', () => {
    const history = [
      { post_date: daysAgo(0) },
      { post_date: daysAgo(1) },
      { post_date: daysAgo(2) },
    ]
    const result = calculateStreak(history)
    expect(result.current).toBe(3)
    expect(result.longest).toBe(3)
  })

  it('resets current streak when there is a gap', () => {
    const history = [
      { post_date: daysAgo(0) },
      { post_date: daysAgo(1) },
      { post_date: daysAgo(3) }, // gap on day 2
      { post_date: daysAgo(4) },
    ]
    const result = calculateStreak(history)
    expect(result.current).toBe(2)
    expect(result.longest).toBe(2)
  })

  it('tracks longest streak across a gap', () => {
    const history = [
      { post_date: daysAgo(0) },
      { post_date: daysAgo(5) },
      { post_date: daysAgo(6) },
      { post_date: daysAgo(7) },
    ]
    const result = calculateStreak(history)
    expect(result.current).toBe(1)
    expect(result.longest).toBe(3)
  })

  it('deduplicates dates', () => {
    const history = [
      { post_date: daysAgo(0) },
      { post_date: daysAgo(0) }, // duplicate
      { post_date: daysAgo(1) },
    ]
    const result = calculateStreak(history)
    expect(result.current).toBe(2)
  })
})
