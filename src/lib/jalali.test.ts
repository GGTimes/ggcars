import { toGregorian, toJalaali } from 'jalaali-js'
import { describe, expect, it } from 'vitest'
import { formatJalali, parseJalali } from './jalali'

describe('jalali dates', () => {
  it('converts 22 Bahman 1357', () => {
    expect(toGregorian(1357, 11, 22)).toEqual({ gy: 1979, gm: 2, gd: 11 })
    expect(toJalaali(1979, 2, 11)).toEqual({ jy: 1357, jm: 11, jd: 22 })
  })

  it('round-trips a jalali date through local noon', () => {
    const parsed = parseJalali('۱۴۰۵/۰۷/۱۶')
    expect(parsed).not.toBeNull()
    expect(formatJalali(parsed as Date)).toBe('۱۴۰۵/۰۷/۱۶')
  })
})
