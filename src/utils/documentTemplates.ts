/**
 * Document name templates for UK legal documents
 * Templates include placeholders that users can fill in
 */

export interface DocumentTemplate {
  name: string;
  category: 'full-date' | 'month-year' | 'year-only' | 'no-date';
  precision: 'day' | 'month' | 'year' | 'none';
}

export const documentTemplates: DocumentTemplate[] = [
  // FULL DATE TEMPLATES (day precision)
  {
    name: 'Witness Statement - [Name] - [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Contract - [Parties] - [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Invoice dated [DD-MM-YYYY] - [Amount]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Letter [From] to [To] - [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Medical Report - [Doctor Name] - [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Expert Report - [Expert Name] - [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Application dated [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Order dated [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Judgment dated [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },
  {
    name: 'Email correspondence - [DD-MM-YYYY]',
    category: 'full-date',
    precision: 'day',
  },

  // MONTH + YEAR TEMPLATES (month precision)
  {
    name: 'Bank Statement - [Month YYYY]',
    category: 'month-year',
    precision: 'month',
  },
  {
    name: 'Correspondence - [Month YYYY]',
    category: 'month-year',
    precision: 'month',
  },
  {
    name: 'Documents from [Month YYYY]',
    category: 'month-year',
    precision: 'month',
  },
  {
    name: 'Records - [Month YYYY]',
    category: 'month-year',
    precision: 'month',
  },

  // YEAR ONLY TEMPLATES (year precision)
  {
    name: 'Annual Report [YYYY]',
    category: 'year-only',
    precision: 'year',
  },
  {
    name: 'Documents from [YYYY]',
    category: 'year-only',
    precision: 'year',
  },
  {
    name: 'Records [YYYY]',
    category: 'year-only',
    precision: 'year',
  },

  // NO DATE TEMPLATES
  {
    name: 'Witness List',
    category: 'no-date',
    precision: 'none',
  },
  {
    name: 'Case Summary',
    category: 'no-date',
    precision: 'none',
  },
  {
    name: 'Bundle Index',
    category: 'no-date',
    precision: 'none',
  },
  {
    name: 'Correspondence (undated)',
    category: 'no-date',
    precision: 'none',
  },
  {
    name: 'Custom name...',
    category: 'no-date',
    precision: 'none',
  },
];

/**
 * Search templates by query string
 * Returns matching templates, limited to maxResults
 */
export function searchTemplates(query: string, maxResults: number = 8): DocumentTemplate[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  const matches = documentTemplates.filter(template =>
    template.name.toLowerCase().includes(normalizedQuery)
  );

  return matches.slice(0, maxResults);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
  return documentTemplates.filter(template => template.category === category);
}

/**
 * Select placeholder text in a template
 * Returns range of first placeholder or null
 */
export function getFirstPlaceholderRange(text: string): { start: number; end: number } | null {
  const placeholderPattern = /\[([^\]]+)\]/;
  const match = text.match(placeholderPattern);

  if (match && match.index !== undefined) {
    return {
      start: match.index,
      end: match.index + match[0].length,
    };
  }

  return null;
}

/**
 * Get all placeholders in a template
 */
export function getAllPlaceholders(text: string): string[] {
  const placeholderPattern = /\[([^\]]+)\]/g;
  const matches = text.matchAll(placeholderPattern);
  const placeholders: string[] = [];

  for (const match of matches) {
    placeholders.push(match[0]);
  }

  return placeholders;
}
