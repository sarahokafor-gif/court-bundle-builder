/**
 * Context-aware document name templates for UK legal proceedings
 * Organized by case type with comprehensive coverage of document types
 */

import { BundleType } from '../types';

export interface DocumentTemplate {
  name: string;
  category: 'full-date' | 'month-year' | 'year-only' | 'no-date';
  precision: 'day' | 'month' | 'year' | 'none';
  caseTypes: BundleType[]; // Which case types this template is relevant for
  priority: number; // Higher priority templates appear first for matching case types
}

/**
 * Comprehensive template library organized by case type
 */
export const documentTemplates: DocumentTemplate[] = [
  // ==========================================
  // FAMILY LAW TEMPLATES
  // ==========================================

  // Family - Care Proceedings (Children Act 1989)
  { name: 'Care Plan - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Child Looked After Review Minutes - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Initial Child Protection Conference Minutes - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Core Assessment - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Section 7 Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Section 37 Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Guardian\'s Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'IRO Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Parenting Assessment - [Assessor Name] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9 },
  { name: 'Contact Notes - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8 },
  { name: 'Social Work Chronology', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10 },
  { name: 'Threshold Document', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10 },
  { name: 'Permanence Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9 },
  { name: 'Placement Order Application', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9 },
  { name: 'Special Guardianship Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9 },

  // Family - Private Law (Children)
  { name: 'CAFCASS Section 7 Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10 },
  { name: 'Child Arrangements Order Application (C100)', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10 },
  { name: 'Position Statement - [Party Name] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9 },
  { name: 'MIAM Certificate - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9 },
  { name: 'Safeguarding Letter (CAFCASS) - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8 },

  // Family - Financial Remedy
  { name: 'Form E - [Party Name]', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10 },
  { name: 'Form A - Financial Remedy Application', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10 },
  { name: 'Schedule of Assets', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9 },
  { name: 'Pension Valuation - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8 },
  { name: 'Property Valuation - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8 },
  { name: 'Bank Statements - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['family', 'civil', 'employment'], priority: 7 },
  { name: 'Mortgage Statement - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['family', 'civil'], priority: 7 },
  { name: 'Chronology of Financial Events', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9 },
  { name: 'FDR Position Statement - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9 },

  // ==========================================
  // CIVIL LAW TEMPLATES
  // ==========================================

  // Civil - General Litigation
  { name: 'Particulars of Claim - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 10 },
  { name: 'Defence - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 10 },
  { name: 'Reply to Defence - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 10 },
  { name: 'Witness Statement - [Name] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family', 'employment'], priority: 10 },
  { name: 'Expert Report - [Expert Name] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family'], priority: 9 },
  { name: 'Schedule of Loss - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'employment'], priority: 9 },
  { name: 'Chronology of Events', category: 'no-date', precision: 'none', caseTypes: ['civil', 'family', 'employment'], priority: 9 },
  { name: 'List of Issues', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9 },
  { name: 'Case Summary', category: 'no-date', precision: 'none', caseTypes: ['civil', 'family', 'employment'], priority: 8 },

  // Civil - Disclosure
  { name: 'Disclosure Statement (N265)', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9 },
  { name: 'List of Documents', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9 },
  { name: 'Contract dated [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'employment'], priority: 8 },
  { name: 'Invoice dated [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 8 },
  { name: 'Letter [From] to [To] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family', 'employment'], priority: 7 },
  { name: 'Email Correspondence - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family', 'employment'], priority: 7 },
  { name: 'Medical Records - [Provider] - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['civil', 'family'], priority: 8 },

  // Civil - Applications
  { name: 'Application Notice (N244) - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 9 },
  { name: 'Order dated [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family'], priority: 9 },
  { name: 'Judgment dated [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family'], priority: 9 },
  { name: 'Directions Order - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family'], priority: 8 },

  // ==========================================
  // EMPLOYMENT TRIBUNAL TEMPLATES
  // ==========================================

  { name: 'ET1 Claim Form - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 10 },
  { name: 'ET3 Response Form - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 10 },
  { name: 'Contract of Employment - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 10 },
  { name: 'Grievance Letter - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 9 },
  { name: 'Disciplinary Letter - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 9 },
  { name: 'Appeal Letter - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 9 },
  { name: 'Dismissal Letter - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 9 },
  { name: 'Payslips - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['employment'], priority: 8 },
  { name: 'P60 - [YYYY]', category: 'year-only', precision: 'year', caseTypes: ['employment'], priority: 8 },
  { name: 'P45 - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 8 },
  { name: 'Sickness Records - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['employment'], priority: 7 },
  { name: 'Performance Review - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['employment'], priority: 7 },
  { name: 'Staff Handbook', category: 'no-date', precision: 'none', caseTypes: ['employment'], priority: 7 },
  { name: 'Equal Pay Questionnaire - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 8 },
  { name: 'ACAS Early Conciliation Certificate', category: 'no-date', precision: 'none', caseTypes: ['employment'], priority: 9 },
  { name: 'Disability Impact Statement - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 8 },

  // ==========================================
  // INQUEST TEMPLATES
  // ==========================================

  { name: 'Post-Mortem Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10 },
  { name: 'Toxicology Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10 },
  { name: 'Police Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10 },
  { name: 'Ambulance Records - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 9 },
  { name: 'Hospital Records - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['inquest'], priority: 9 },
  { name: 'GP Records - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['inquest'], priority: 9 },
  { name: 'Expert Medical Report - [Expert] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 9 },
  { name: 'Witness Statement - [Name] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 9 },
  { name: 'Rule 43 Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 8 },
  { name: 'Coroner\'s Report to Prevent Future Deaths - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 8 },

  // ==========================================
  // TRIBUNAL TEMPLATES (General)
  // ==========================================

  { name: 'Appeal Form - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 10 },
  { name: 'Grounds of Appeal - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 10 },
  { name: 'Decision Notice - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 10 },
  { name: 'Statement of Reasons - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 9 },
  { name: 'Appellant\'s Bundle Index', category: 'no-date', precision: 'none', caseTypes: ['tribunal'], priority: 9 },
  { name: 'Respondent\'s Bundle Index', category: 'no-date', precision: 'none', caseTypes: ['tribunal'], priority: 9 },
  { name: 'Skeleton Argument - [Party] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['tribunal', 'civil'], priority: 9 },
  { name: 'Authorities Bundle', category: 'no-date', precision: 'none', caseTypes: ['tribunal', 'civil'], priority: 8 },

  // ==========================================
  // COURT OF PROTECTION TEMPLATES
  // ==========================================

  { name: 'Capacity Assessment - [Assessor] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 10 },
  { name: 'Best Interests Assessment - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 10 },
  { name: 'Court of Protection Application (COP1)', category: 'no-date', precision: 'none', caseTypes: ['court-of-protection'], priority: 10 },
  { name: 'Deputy\'s Report - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 9 },
  { name: 'Medical Report - [Doctor] - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection', 'civil'], priority: 9 },
  { name: 'Care Plan - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 9 },
  { name: 'Financial Statement', category: 'no-date', precision: 'none', caseTypes: ['court-of-protection'], priority: 8 },
  { name: 'Property and Affairs Report - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['court-of-protection'], priority: 8 },
  { name: 'Mental Capacity Act Assessment - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 10 },

  // ==========================================
  // GENERAL TEMPLATES (All Case Types)
  // ==========================================

  { name: 'Skeleton Argument - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family', 'employment', 'tribunal'], priority: 8 },
  { name: 'Chronology', category: 'no-date', precision: 'none', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 8 },
  { name: 'Correspondence - [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 6 },
  { name: 'Documents from [Month YYYY]', category: 'month-year', precision: 'month', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 6 },
  { name: 'Annual Report [YYYY]', category: 'year-only', precision: 'year', caseTypes: ['general'], priority: 5 },
  { name: 'Records [YYYY]', category: 'year-only', precision: 'year', caseTypes: ['general'], priority: 5 },
  { name: 'Witness List', category: 'no-date', precision: 'none', caseTypes: ['general', 'civil', 'family'], priority: 7 },
  { name: 'Bundle Index', category: 'no-date', precision: 'none', caseTypes: ['general', 'civil', 'family', 'employment', 'tribunal'], priority: 7 },
  { name: 'Correspondence (undated)', category: 'no-date', precision: 'none', caseTypes: ['general'], priority: 5 },
  { name: 'Legal Submissions - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 7 },
  { name: 'Case Analysis - [DD-MM-YYYY]', category: 'full-date', precision: 'day', caseTypes: ['general'], priority: 6 },
  { name: 'Custom name...', category: 'no-date', precision: 'none', caseTypes: ['general'], priority: 1 },
];

/**
 * Search templates by query string with case-type prioritization
 * Returns matching templates, prioritizing those relevant to the current case type
 */
export function searchTemplates(
  query: string,
  maxResults: number = 8,
  caseType?: BundleType
): DocumentTemplate[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Find all matching templates
  const matches = documentTemplates.filter(template =>
    template.name.toLowerCase().includes(normalizedQuery)
  );

  // Sort by relevance: case-type matches first, then by priority, then alphabetically
  const sorted = matches.sort((a, b) => {
    const aRelevant = caseType && a.caseTypes.includes(caseType);
    const bRelevant = caseType && b.caseTypes.includes(caseType);

    // Case-type relevant templates come first
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;

    // Then sort by priority (higher first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // Finally alphabetically
    return a.name.localeCompare(b.name);
  });

  return sorted.slice(0, maxResults);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
  return documentTemplates.filter(template => template.category === category);
}

/**
 * Get templates by case type, sorted by priority
 */
export function getTemplatesByCaseType(caseType: BundleType, maxResults?: number): DocumentTemplate[] {
  const templates = documentTemplates
    .filter(template => template.caseTypes.includes(caseType))
    .sort((a, b) => b.priority - a.priority);

  return maxResults ? templates.slice(0, maxResults) : templates;
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
