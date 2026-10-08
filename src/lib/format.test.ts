import { describe, expect, it } from 'vitest'
import {
  caretAfterDigits,
  formatToman,
  groupTomanInput,
  parseTomanInput,
  tomanInWords,
} from './format'

describe('toman formatting', () => {
  it('groups whole toman with Persian digits', () => {
    expect(formatToman(1200n)).toBe('۱٬۲۰۰ تومان')
    expect(formatToman(-200n)).toBe('−۲۰۰ تومان')
    expect(formatToman(500000000n)).toBe('۵۰۰٬۰۰۰٬۰۰۰ تومان')
  })

  it('accepts Persian, Arabic, and separated digits', () => {
    expect(parseTomanInput('۱٬۲۰۰')).toBe('1200')
    expect(parseTomanInput('١٬٢٠٠')).toBe('1200')
    expect(parseTomanInput('1,200,000')).toBe('1200000')
    expect(parseTomanInput('۰')).toBe('0')
  })

  it('groups typed toman and reads them in words', () => {
    expect(groupTomanInput('1200000')).toBe('۱٬۲۰۰٬۰۰۰')
    expect(groupTomanInput('۱۲۰۰۰۰۰')).toBe('۱٬۲۰۰٬۰۰۰')
    expect(tomanInWords('0')).toBe('صفر تومان')
    expect(tomanInWords('15')).toBe('پانزده تومان')
    expect(tomanInWords('21')).toBe('بیست و یک تومان')
    expect(tomanInWords('101')).toBe('صد و یک تومان')
    expect(tomanInWords('1000')).toBe('هزار تومان')
    expect(tomanInWords('1001')).toBe('هزار و یک تومان')
    expect(tomanInWords('21000')).toBe('بیست و یک هزار تومان')
    expect(tomanInWords('1200000')).toBe('یک میلیون و دویست هزار تومان')
    expect(tomanInWords('1250000')).toBe('یک میلیون و دویست و پنجاه هزار تومان')
    expect(tomanInWords('500000000')).toBe('پانصد میلیون تومان')
    expect(tomanInWords('1000000000')).toBe('یک میلیارد تومان')
    expect(caretAfterDigits('۱٬۲۰۰', 2)).toBe(3)
    expect(caretAfterDigits('۱٬۲۰۰', 4)).toBe(5)
  })

  it('rejects decimals', () => {
    expect(parseTomanInput('1.5')).toBeNull()
    expect(parseTomanInput('۱٫۵')).toBeNull()
    expect(parseTomanInput('')).toBeNull()
  })
})
