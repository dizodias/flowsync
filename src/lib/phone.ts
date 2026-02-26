import { parsePhoneNumber } from 'react-phone-number-input'

export type CountryCode = string

/**
 * Returns a Unicode flag emoji for a two-letter ISO country code (e.g. "US" -> 🇺🇸).
 */
export function countryToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return ''
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
}

export interface ParsedPhone {
  country: CountryCode
  formatted: string
  national: string
}

/**
 * Parse a phone number string (E.164 or with country code) and return country and formatted display.
 */
export function parsePhoneForDisplay(value: string): ParsedPhone | null {
  if (!value || !value.trim()) return null
  const parsed = parsePhoneNumber(value)
  if (!parsed) return null
  return {
    country: parsed.country ?? 'US',
    formatted: parsed.formatInternational(),
    national: parsed.formatNational(),
  }
}
