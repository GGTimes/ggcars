import { isValidJalaaliDate, toGregorian, toJalaali } from 'jalaali-js'
import { toEnglishDigits, toPersianDigits } from './format'

export function formatJalali(date: Date): string {
  const { jy, jm, jd } = toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  )
  const text = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
  return toPersianDigits(text)
}

export function formatJalaliIso(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatJalali(date)
}

export function todayJalaliInput(): string {
  const { jy, jm, jd } = toJalaali(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
  )
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
}

export function parseJalali(value: string): Date | null {
  const match = toEnglishDigits(value)
    .trim()
    .match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return null
  const jy = Number(match[1])
  const jm = Number(match[2])
  const jd = Number(match[3])
  if (!isValidJalaaliDate(jy, jm, jd)) return null
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd, 12, 0, 0, 0)
}
