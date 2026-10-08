const persian = '۰۱۲۳۴۵۶۷۸۹'
const arabic = '٠١٢٣٤٥٦٧٨٩'

export function toPersianDigits(value: string): string {
  return value.replace(/\d/g, (digit) => persian[Number(digit)] ?? digit)
}

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
}

export function parseTomanInput(value: string): string | null {
  const english = toEnglishDigits(value).trim()
  if (!english) return null
  if (/[.٫]/.test(english)) return null
  const digits = english.replace(/[^\d]/g, '')
  if (!digits) return null
  return digits.replace(/^0+(?=\d)/, '')
}

export function formatToman(
  value: bigint | string,
  options?: { withUnit?: boolean },
): string {
  const raw = value.toString()
  const negative = raw.startsWith('-')
  const digits = raw.replace('-', '')
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
  const number = `${negative ? '−' : ''}${toPersianDigits(grouped)}`
  if (options?.withUnit === false) return number
  return `${number} تومان`
}

export function groupTomanInput(value: string): string {
  const parsed = parseTomanInput(value)
  if (parsed == null) return ''
  return formatToman(parsed, { withUnit: false })
}

export function caretAfterDigits(
  formatted: string,
  digitCount: number,
): number {
  if (digitCount <= 0) return 0
  let seen = 0
  for (let index = 0; index < formatted.length; index++) {
    const char = formatted[index] ?? ''
    if (/[0-9۰-۹]/.test(char)) seen += 1
    if (seen === digitCount) return index + 1
  }
  return formatted.length
}

const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const teens = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
]
const tens = [
  '',
  '',
  'بیست',
  'سی',
  'چهل',
  'پنجاه',
  'شصت',
  'هفتاد',
  'هشتاد',
  'نود',
]
const hundreds = [
  '',
  'صد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
]
const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون', 'تریلیارد']

function threeDigits(value: number): string {
  const parts: string[] = []
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  if (hundred) parts.push(hundreds[hundred] ?? '')
  if (rest >= 10 && rest < 20) parts.push(teens[rest - 10] ?? '')
  else {
    const ten = Math.floor(rest / 10)
    const one = rest % 10
    if (ten) parts.push(tens[ten] ?? '')
    if (one) parts.push(ones[one] ?? '')
  }
  return parts.filter(Boolean).join(' و ')
}

export function tomanInWords(value: bigint | string): string {
  const digits = value.toString().replace('-', '')
  if (!/^\d+$/.test(digits) || digits === '0') return 'صفر تومان'
  const groups: number[] = []
  let rest = digits
  while (rest.length > 0) {
    groups.push(Number(rest.slice(-3)))
    rest = rest.slice(0, -3)
  }
  const parts: string[] = []
  for (let index = groups.length - 1; index >= 0; index--) {
    const group = groups[index] ?? 0
    if (group === 0) continue
    const scale = scales[index] ?? ''
    if (index === 1 && group === 1) parts.push('هزار')
    else
      parts.push(scale ? `${threeDigits(group)} ${scale}` : threeDigits(group))
  }
  return `${parts.join(' و ')} تومان`
}
