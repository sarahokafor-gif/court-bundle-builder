/**
 * Extracts dates from filenames using various common formats
 * Supports UK and international date formats with precision levels
 */

import { DatePrecision } from '../types';

export interface DateExtractionResult {
  date: string | null; // Date in DD-MM-YYYY format (or MM-YYYY for month, or YYYY for year)
  precision: DatePrecision; // Level of precision: day, month, year, or none
}

/**
 * Attempts to extract a date from a filename with precision level
 * Tries patterns in order: full date → month+year → year only
 *
 * @param filename - The filename to extract a date from
 * @returns DateExtractionResult with date and precision
 */
export function extractDateWithPrecision(filename: string): DateExtractionResult {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

  // LEVEL 1: Try to extract full date (day precision)
  const fullDateResult = tryExtractFullDate(nameWithoutExt)
  if (fullDateResult) {
    return { date: fullDateResult, precision: 'day' }
  }

  // LEVEL 2: Try to extract month + year (month precision)
  const monthYearResult = tryExtractMonthYear(nameWithoutExt)
  if (monthYearResult) {
    return { date: monthYearResult, precision: 'month' }
  }

  // LEVEL 3: Try to extract year only (year precision)
  const yearResult = tryExtractYear(nameWithoutExt)
  if (yearResult) {
    return { date: yearResult, precision: 'year' }
  }

  // LEVEL 4: No date found
  return { date: null, precision: 'none' }
}

/**
 * Legacy function for backward compatibility
 * Attempts to extract a date from a filename
 * Supports multiple date formats commonly used in legal document naming
 *
 * @param filename - The filename to extract a date from
 * @returns Date string in DD-MM-YYYY format if found, null otherwise
 */
export function extractDateFromFilename(filename: string): string | null {
  const result = extractDateWithPrecision(filename)
  return result.precision === 'day' ? result.date : null
}

/**
 * Try to extract full date (day precision)
 */
function tryExtractFullDate(text: string): string | null {
  // Date format patterns (in order of priority)
  const patterns = [
    // YYYY-MM-DD (2024-01-15)
    {
      regex: /(\d{4})-(\d{2})-(\d{2})/,
      parse: (match: RegExpMatchArray) => {
        const year = parseInt(match[1])
        const month = parseInt(match[2])
        const day = parseInt(match[3])
        return { day, month, year }
      }
    },
    // YYYYMMDD (20240115)
    {
      regex: /(\d{4})(\d{2})(\d{2})/,
      parse: (match: RegExpMatchArray) => {
        const year = parseInt(match[1])
        const month = parseInt(match[2])
        const day = parseInt(match[3])
        return { day, month, year }
      }
    },
    // DD-MM-YYYY (15-01-2024) - UK format
    {
      regex: /(\d{1,2})-(\d{1,2})-(\d{4})/,
      parse: (match: RegExpMatchArray) => {
        const day = parseInt(match[1])
        const month = parseInt(match[2])
        const year = parseInt(match[3])
        return { day, month, year }
      }
    },
    // DD/MM/YYYY (15/01/2024) - UK format
    {
      regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      parse: (match: RegExpMatchArray) => {
        const day = parseInt(match[1])
        const month = parseInt(match[2])
        const year = parseInt(match[3])
        return { day, month, year }
      }
    },
    // DD.MM.YYYY (15.01.2024) - European format
    {
      regex: /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      parse: (match: RegExpMatchArray) => {
        const day = parseInt(match[1])
        const month = parseInt(match[2])
        const year = parseInt(match[3])
        return { day, month, year }
      }
    },
    // DD_MM_YYYY (15_01_2024) - Underscore format
    {
      regex: /(\d{1,2})_(\d{1,2})_(\d{4})/,
      parse: (match: RegExpMatchArray) => {
        const day = parseInt(match[1])
        const month = parseInt(match[2])
        const year = parseInt(match[3])
        return { day, month, year }
      }
    }
  ]

  // Try each pattern
  for (const pattern of patterns) {
    const match = text.match(pattern.regex)
    if (match) {
      try {
        const { day, month, year } = pattern.parse(match)

        // Validate the date
        if (isValidDate(day, month, year)) {
          // Return in DD-MM-YYYY format
          return formatDate(day, month, year)
        }
      } catch (error) {
        // If parsing fails, try next pattern
        continue
      }
    }
  }

  return null
}

/**
 * Try to extract month + year (month precision)
 */
function tryExtractMonthYear(text: string): string | null {
  // Month names
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  // Pattern 1: "June 2025", "June-2025", "June_2025"
  for (let i = 0; i < months.length; i++) {
    const monthName = months[i];
    const patterns = [
      new RegExp(`${monthName}\\s+(\\d{4})`, 'i'),
      new RegExp(`${monthName}-(\\d{4})`, 'i'),
      new RegExp(`${monthName}_(\\d{4})`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const year = parseInt(match[1]);
        if (year >= 2000 && year <= 2099) {
          const monthNum = i + 1;
          return `${monthNum.toString().padStart(2, '0')}-${year}`;
        }
      }
    }
  }

  // Pattern 2: "06/2025", "06-2025"
  const numericMonthYear = text.match(/(\d{1,2})[\/-](\d{4})/);
  if (numericMonthYear) {
    const month = parseInt(numericMonthYear[1]);
    const year = parseInt(numericMonthYear[2]);

    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2099) {
      return `${month.toString().padStart(2, '0')}-${year}`;
    }
  }

  // Pattern 3: "2025-06", "2025/06"
  const yearMonth = text.match(/(\d{4})[\/-](\d{1,2})/);
  if (yearMonth) {
    const year = parseInt(yearMonth[1]);
    const month = parseInt(yearMonth[2]);

    if (year >= 2000 && year <= 2099 && month >= 1 && month <= 12) {
      return `${month.toString().padStart(2, '0')}-${year}`;
    }
  }

  return null;
}

/**
 * Try to extract year only (year precision)
 */
function tryExtractYear(text: string): string | null {
  // Match 4-digit year with word boundaries (not part of larger number)
  const yearMatch = text.match(/\b(20\d{2})\b/);

  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 2000 && year <= 2099) {
      return year.toString();
    }
  }

  return null;
}

/**
 * Validates if the given day, month, year combination is a valid date
 */
function isValidDate(day: number, month: number, year: number): boolean {
  // Basic range checks
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > 2100) return false

  // Create Date object and check if it's valid
  // Note: JavaScript Date months are 0-indexed
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * Formats day, month, year into DD-MM-YYYY string
 */
function formatDate(day: number, month: number, year: number): string {
  const dd = day.toString().padStart(2, '0')
  const mm = month.toString().padStart(2, '0')
  return `${dd}-${mm}-${year}`
}

/**
 * Converts DD-MM-YYYY format to YYYY-MM-DD format (for HTML date input)
 */
export function formatDateForInput(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split('-')
  if (parts.length !== 3) return ''

  const [day, month, year] = parts
  return `${year}-${month}-${day}`
}

/**
 * Converts YYYY-MM-DD format (from HTML date input) to DD-MM-YYYY format
 */
export function formatDateFromInput(yyyymmdd: string): string {
  const parts = yyyymmdd.split('-')
  if (parts.length !== 3) return ''

  const [year, month, day] = parts
  return `${day}-${month}-${year}`
}

/**
 * Parses DD-MM-YYYY string to Date object
 */
export function parseDateString(ddmmyyyy: string): Date | null {
  const parts = ddmmyyyy.split('-')
  if (parts.length !== 3) return null

  const day = parseInt(parts[0])
  const month = parseInt(parts[1])
  const year = parseInt(parts[2])

  if (!isValidDate(day, month, year)) return null

  // JavaScript Date months are 0-indexed
  return new Date(year, month - 1, day)
}
