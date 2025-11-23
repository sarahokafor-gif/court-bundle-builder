/**
 * Context-aware document name templates for UK legal proceedings
 * Comprehensive database with intelligent fuzzy matching
 */

import { BundleType } from '../types';

export interface DocumentTemplate {
  name: string;
  category: 'full-date' | 'month-year' | 'year-only' | 'no-date';
  precision: 'day' | 'month' | 'year' | 'none';
  caseTypes: BundleType[];
  priority: number;
  aliases?: string[]; // Alternative names/codes for better matching
}

/**
 * Comprehensive template library with ALL major UK court forms
 */
export const documentTemplates: DocumentTemplate[] = [
  // ==========================================
  // CIVIL COURT FORMS (N-Series)
  // ==========================================

  // Claims and Applications
  { name: 'N1 - Claim Form', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 10, aliases: ['N1', 'Claim Form'] },
  { name: 'N1A - Notes for Claimant', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 7, aliases: ['N1A'] },
  { name: 'N9 - Defence and Counterclaim', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 10, aliases: ['N9', 'Defence'] },
  { name: 'N9A - Admission Form', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9, aliases: ['N9A', 'Admission'] },
  { name: 'N9B - Defence (Specified Amount)', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9, aliases: ['N9B'] },
  { name: 'N9C - Defence (Unspecified Amount)', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9, aliases: ['N9C'] },
  { name: 'N9D - Counterclaim', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9, aliases: ['N9D', 'Counterclaim'] },
  { name: 'N11 - Acknowledgment of Service', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 10, aliases: ['N11', 'AOS', 'Acknowledgment'] },
  { name: 'N20 - Dispute to Jurisdiction', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 8, aliases: ['N20'] },
  { name: 'N205A - Reply to Defence', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9, aliases: ['N205A', 'Reply'] },
  { name: 'N205B - Reply to Defence (Specified)', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 8, aliases: ['N205B'] },
  { name: 'N208 - Part 8 Claim Form', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9, aliases: ['N208', 'Part 8'] },
  { name: 'N208A - Notes for Claimant (Part 8)', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 6, aliases: ['N208A'] },
  { name: 'N210 - Statement of Costs', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family'], priority: 9, aliases: ['N210', 'Costs'] },
  { name: 'N215 - Certificate of Service', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family'], priority: 8, aliases: ['N215', 'Service'] },
  { name: 'N225 - Request for Judgment', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 9, aliases: ['N225', 'Judgment'] },
  { name: 'N244 - Application Notice', category: 'no-date', precision: 'none', caseTypes: ['civil', 'family'], priority: 10, aliases: ['N244', 'Application Notice'] },
  { name: 'N260 - Statement of Truth', category: 'full-date', precision: 'day', caseTypes: ['civil', 'family'], priority: 8, aliases: ['N260', 'Statement of Truth'] },
  { name: 'N266 - Notice of Discontinuance', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 8, aliases: ['N266', 'Discontinuance'] },

  // Witness and Evidence
  { name: 'N20 - Witness Statement', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 10, aliases: ['Witness Statement'] },
  { name: 'N322 - Notice of Commencement of Assessment', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 7, aliases: ['N322'] },
  { name: 'N349 - Interim Costs Certificate', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 7, aliases: ['N349'] },

  // Enforcement
  { name: 'N323 - Warrant of Control', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 8, aliases: ['N323', 'Warrant'] },
  { name: 'N325 - Certificate of Judgment', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 7, aliases: ['N325'] },
  { name: 'N337 - Request for Charging Order', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 8, aliases: ['N337', 'Charging Order'] },
  { name: 'N349A - Final Costs Certificate', category: 'full-date', precision: 'day', caseTypes: ['civil'], priority: 7, aliases: ['N349A'] },
  { name: 'N380 - Third Party Debt Order', category: 'no-date', precision: 'none', caseTypes: ['civil'], priority: 8, aliases: ['N380'] },

  // Appeals
  { name: 'N161 - Appellant\'s Notice', category: 'no-date', precision: 'none', caseTypes: ['civil', 'family'], priority: 9, aliases: ['N161', 'Appeal', 'Appellant'] },
  { name: 'N162 - Respondent\'s Notice', category: 'no-date', precision: 'none', caseTypes: ['civil', 'family'], priority: 9, aliases: ['N162', 'Respondent'] },
  { name: 'N164 - Application for Permission to Appeal', category: 'no-date', precision: 'none', caseTypes: ['civil', 'family'], priority: 9, aliases: ['N164', 'Permission Appeal'] },

  // ==========================================
  // FAMILY COURT FORMS (C, FL, D-Series)
  // ==========================================

  // Children - Private Law (C-Series)
  { name: 'C100 - Child Arrangements Order Application', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['C100', 'CAO', 'Child Arrangements'] },
  { name: 'C1A - Allegations of Harm', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['C1A', 'Harm', 'Allegations'] },
  { name: 'C2 - Application in Existing Proceedings', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['C2', 'Application'] },
  { name: 'C3 - Application for Variation, Discharge or Suspension', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['C3', 'Variation'] },
  { name: 'C4 - Application for Witness Summons', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 7, aliases: ['C4', 'Witness Summons'] },
  { name: 'C6 - Notice of Change of Details', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 6, aliases: ['C6'] },
  { name: 'C6A - Notice of Acting in Person', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 6, aliases: ['C6A', 'Acting Person'] },
  { name: 'C7 - Acknowledgement of Service (C100)', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['C7', 'C100 AOS'] },
  { name: 'C8 - Confidential Contact Details', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['C8'] },
  { name: 'C9 - Statement of Service', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 7, aliases: ['C9', 'Service'] },
  { name: 'C10 - Application to Withdraw', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 7, aliases: ['C10', 'Withdraw'] },
  { name: 'C10A - Application to Delay Service', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 6, aliases: ['C10A'] },
  { name: 'C13 - Supplement for Parental Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 7, aliases: ['C13', 'Parental Order'] },
  { name: 'C43 - Application for Special Guardianship', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9, aliases: ['C43', 'Special Guardianship', 'SGO'] },
  { name: 'C43A - Report on Suitability of Applicant (SGO)', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8, aliases: ['C43A'] },
  { name: 'C45 - Parental Order Application', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 7, aliases: ['C45'] },
  { name: 'C47 - Application for Non-Molestation Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['C47', 'Non-Molestation'] },
  { name: 'C51 - Application for Adoption', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9, aliases: ['C51', 'Adoption'] },
  { name: 'C63 - Application for Leave to Remove', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9, aliases: ['C63', 'Leave Remove', 'Removal'] },

  // Care Proceedings
  { name: 'C1 - Care Order Application', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['C1', 'Care Order'] },
  { name: 'C13 - Supplement for Care/Supervision', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['C13'] },
  { name: 'C20 - Application for Emergency Protection Order', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['C20', 'EPO', 'Emergency Protection'] },
  { name: 'C21 - Interim Care Order', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['C21', 'ICO'] },
  { name: 'C22 - Care Plan', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['C22', 'Care Plan'] },
  { name: 'C23 - Application for Discharge of Care Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['C23', 'Discharge Care'] },

  // Divorce and Financial (D and FL-Series)
  { name: 'D8 - Divorce Petition', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['D8', 'Divorce', 'Petition'] },
  { name: 'D10 - Acknowledgement of Service (Divorce)', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['D10', 'Divorce AOS'] },
  { name: 'D11 - Application Notice (Family)', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['D11', 'Family Application'] },
  { name: 'D36 - Decree Nisi', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['D36', 'Nisi'] },
  { name: 'D80 - Notice of Application for Decree Absolute', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['D80', 'Absolute'] },
  { name: 'D81 - Statement of Information', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['D81'] },
  { name: 'D84 - Application for Consent Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9, aliases: ['D84', 'Consent Order'] },

  // Financial Remedy Forms
  { name: 'Form A - Financial Remedy Application', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['Form A', 'FRA'] },
  { name: 'Form E - Financial Statement', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['Form E', 'Financial Statement'] },
  { name: 'Form F - Notice of First Appointment', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8, aliases: ['Form F', 'FDA'] },
  { name: 'Form G - Notice of Financial Dispute Resolution', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8, aliases: ['Form G', 'FDR'] },
  { name: 'Form H - Costs Estimate', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8, aliases: ['Form H', 'Costs'] },
  { name: 'Form P1 - Pension Attachment Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 7, aliases: ['Form P1', 'P1', 'Pension'] },
  { name: 'Form P2 - Pension Sharing Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 7, aliases: ['Form P2', 'P2'] },

  // Domestic Violence
  { name: 'FL401 - Non-Molestation/Occupation Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['FL401', 'Non-Mol', 'Occupation'] },
  { name: 'FL401A - Non-Molestation Order', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['FL401A'] },
  { name: 'FL402 - Respondent\'s Answer', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 9, aliases: ['FL402'] },
  { name: 'FL403 - Application to Vary/Discharge', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['FL403', 'Vary'] },
  { name: 'FL404 - Witness Statement', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['FL404', 'DV Witness'] },
  { name: 'FL405 - Statement of Service', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 7, aliases: ['FL405'] },
  { name: 'FL406 - Application for Arrest Warrant', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['FL406', 'Arrest Warrant'] },
  { name: 'FL407 - Application for Remand', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 7, aliases: ['FL407', 'Remand'] },
  { name: 'FL415 - Position Statement', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['FL415', 'Position'] },
  { name: 'FL416 - Application for Fact-Finding Hearing', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['FL416', 'Fact-Finding'] },
  { name: 'FL416A - Scott Schedule', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8, aliases: ['FL416A', 'Scott Schedule'] },

  // ==========================================
  // FAMILY LAW DOCUMENTS (Reports & Assessments)
  // ==========================================

  { name: 'CAFCASS Section 7 Report', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['Section 7', 'S7', 'CAFCASS Report'] },
  { name: 'CAFCASS Section 37 Report', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['Section 37', 'S37'] },
  { name: 'CAFCASS Safeguarding Letter', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8, aliases: ['Safeguarding'] },
  { name: 'Guardian\'s Report', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['Guardian', 'Children\'s Guardian'] },
  { name: 'IRO Report', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['IRO', 'Independent Reviewing Officer'] },
  { name: 'Social Work Chronology', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 10, aliases: ['Chronology', 'SW Chronology'] },
  { name: 'Threshold Document', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['Threshold'] },
  { name: 'Parenting Assessment - [Assessor]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['Parenting', 'Parent Assessment'] },
  { name: 'Psychological Assessment - [Psychologist]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['Psych', 'Psychology'] },
  { name: 'Psychiatric Assessment - [Psychiatrist]', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['Psychiatric', 'Psychiatry'] },
  { name: 'Contact Notes', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 8, aliases: ['Contact'] },
  { name: 'Core Assessment', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['Core'] },
  { name: 'Initial Child Protection Conference Minutes', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['ICPC', 'Initial Conference', 'CP Conference'] },
  { name: 'Review Child Protection Conference Minutes', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['RCPC', 'Review Conference'] },
  { name: 'Child Looked After Review Minutes', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 10, aliases: ['LAC Review', 'CLA Review'] },
  { name: 'Permanence Report', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['Permanence', 'Perm Report'] },
  { name: 'MIAM Certificate', category: 'full-date', precision: 'day', caseTypes: ['family'], priority: 9, aliases: ['MIAM', 'Mediation'] },
  { name: 'Risk Assessment', category: 'full-date', precision: 'day', caseTypes: ['family', 'civil'], priority: 9, aliases: ['Risk'] },
  { name: 'Statement of Arrangements for Children', category: 'no-date', precision: 'none', caseTypes: ['family'], priority: 8, aliases: ['Children Arrangements', 'Statement Arrangements'] },

  // ==========================================
  // EMPLOYMENT TRIBUNAL FORMS (ET-Series)
  // ==========================================

  { name: 'ET1 - Claim Form', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 10, aliases: ['ET1', 'Claim'] },
  { name: 'ET3 - Response Form', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 10, aliases: ['ET3', 'Response', 'Defence'] },
  { name: 'ET3A - Employer\'s Contract Claim', category: 'no-date', precision: 'none', caseTypes: ['employment'], priority: 8, aliases: ['ET3A'] },
  { name: 'ET4 - Application', category: 'no-date', precision: 'none', caseTypes: ['employment'], priority: 9, aliases: ['ET4', 'Application'] },
  { name: 'Grievance Letter', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 9, aliases: ['Grievance'] },
  { name: 'Appeal Letter', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 8, aliases: ['Appeal', 'Internal Appeal'] },
  { name: 'Disciplinary Letter', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 8, aliases: ['Disciplinary'] },
  { name: 'Dismissal Letter', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 9, aliases: ['Dismissal', 'Termination'] },
  { name: 'Contract of Employment', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 8, aliases: ['Contract', 'Employment Contract'] },
  { name: 'Staff Handbook', category: 'year-only', precision: 'year', caseTypes: ['employment'], priority: 7, aliases: ['Handbook', 'Policies'] },
  { name: 'Payslips', category: 'month-year', precision: 'month', caseTypes: ['employment'], priority: 7, aliases: ['Payslip', 'Salary'] },
  { name: 'P60', category: 'year-only', precision: 'year', caseTypes: ['employment'], priority: 8, aliases: ['P60', 'Tax Year End'] },
  { name: 'Schedule of Loss', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 10, aliases: ['Schedule Loss', 'Loss'] },
  { name: 'Witness Statement - [Name]', category: 'full-date', precision: 'day', caseTypes: ['employment', 'civil', 'family'], priority: 10, aliases: ['Witness'] },
  { name: 'Medical Report - [Doctor]', category: 'full-date', precision: 'day', caseTypes: ['employment', 'civil', 'tribunal'], priority: 9, aliases: ['Medical', 'Doctor Report'] },
  { name: 'Occupational Health Report', category: 'full-date', precision: 'day', caseTypes: ['employment'], priority: 8, aliases: ['OH', 'Occ Health'] },
  { name: 'Subject Access Request Response', category: 'full-date', precision: 'day', caseTypes: ['employment', 'civil'], priority: 7, aliases: ['SAR', 'DSAR', 'Data Request'] },

  // ==========================================
  // TRIBUNAL FORMS (First-tier & Upper Tribunal)
  // ==========================================

  { name: 'SSCS1 - Social Security Appeal', category: 'no-date', precision: 'none', caseTypes: ['tribunal'], priority: 10, aliases: ['SSCS1', 'PIP Appeal', 'ESA Appeal', 'UC Appeal'] },
  { name: 'SSCS5 - Response to Appeal', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 9, aliases: ['SSCS5'] },
  { name: 'IA1 - Immigration Appeal', category: 'no-date', precision: 'none', caseTypes: ['tribunal'], priority: 10, aliases: ['IA1', 'Immigration'] },
  { name: 'Notice of Appeal to Upper Tribunal', category: 'no-date', precision: 'none', caseTypes: ['tribunal'], priority: 9, aliases: ['UT Appeal', 'Upper Tribunal'] },
  { name: 'Decision Notice', category: 'full-date', precision: 'day', caseTypes: ['tribunal', 'employment'], priority: 10, aliases: ['Decision', 'Tribunal Decision'] },
  { name: 'Mandatory Reconsideration Request', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 10, aliases: ['MR', 'Reconsideration'] },
  { name: 'Mandatory Reconsideration Notice', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 10, aliases: ['MRN'] },
  { name: 'ESA85 - Capability for Work Questionnaire', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 8, aliases: ['ESA85', 'ESA'] },
  { name: 'PIP2 - How Your Disability Affects You', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 8, aliases: ['PIP2', 'PIP'] },
  { name: 'UC50 - Capability for Work Questionnaire', category: 'full-date', precision: 'day', caseTypes: ['tribunal'], priority: 8, aliases: ['UC50', 'UC'] },

  // ==========================================
  // INQUEST DOCUMENTS
  // ==========================================

  { name: 'Post-Mortem Report', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10, aliases: ['PM', 'Post Mortem', 'Autopsy'] },
  { name: 'Toxicology Report', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10, aliases: ['Toxicology', 'Tox Report'] },
  { name: 'Pathologist Report', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10, aliases: ['Pathology'] },
  { name: 'Police Report', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10, aliases: ['Police'] },
  { name: 'Ambulance Records', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 9, aliases: ['Ambulance', 'Paramedic'] },
  { name: 'Medical Records', category: 'full-date', precision: 'day', caseTypes: ['inquest', 'civil', 'tribunal'], priority: 9, aliases: ['Medical Records', 'GP Records', 'Hospital Records'] },
  { name: 'Witness Statement - [Name]', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10 },
  { name: 'Coroner\'s Report', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10, aliases: ['Coroner'] },
  { name: 'Rule 43 Report (Prevention of Future Deaths)', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 9, aliases: ['Rule 43', 'PFD', 'Prevention'] },
  { name: 'Verdict and Conclusions', category: 'full-date', precision: 'day', caseTypes: ['inquest'], priority: 10, aliases: ['Verdict', 'Conclusion'] },

  // ==========================================
  // COURT OF PROTECTION
  // ==========================================

  { name: 'COP1 - Application Form', category: 'no-date', precision: 'none', caseTypes: ['court-of-protection'], priority: 10, aliases: ['COP1'] },
  { name: 'COP3 - Assessment of Capacity', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 10, aliases: ['COP3', 'Capacity', 'MCA'] },
  { name: 'COP4 - Deputy\'s Declaration', category: 'no-date', precision: 'none', caseTypes: ['court-of-protection'], priority: 9, aliases: ['COP4'] },
  { name: 'COP5 - Acknowledgement of Service', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 8, aliases: ['COP5'] },
  { name: 'COP9 - Application Notice', category: 'no-date', precision: 'none', caseTypes: ['court-of-protection'], priority: 9, aliases: ['COP9'] },
  { name: 'COP24 - Witness Statement', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 9, aliases: ['COP24'] },
  { name: 'Deputy\'s Report', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 9, aliases: ['Deputy Report'] },
  { name: 'Mental Capacity Act Assessment', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection'], priority: 10, aliases: ['MCA Assessment'] },
  { name: 'Property and Affairs Report', category: 'month-year', precision: 'month', caseTypes: ['court-of-protection'], priority: 8, aliases: ['Property Affairs'] },
  { name: 'Financial Statement', category: 'full-date', precision: 'day', caseTypes: ['court-of-protection', 'family'], priority: 8 },

  // ==========================================
  // GENERAL DOCUMENTS (All Case Types)
  // ==========================================

  { name: 'Skeleton Argument', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 9, aliases: ['Skeleton', 'Skel Arg'] },
  { name: 'Chronology', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 8, aliases: ['Chronology'] },
  { name: 'Case Summary', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 8, aliases: ['Summary', 'Case Sum'] },
  { name: 'Bundle Index', category: 'no-date', precision: 'none', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 7, aliases: ['Index'] },
  { name: 'Position Statement - [Party]', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 9, aliases: ['Position', 'Pos Statement'] },
  { name: 'Legal Submissions', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 8, aliases: ['Submissions', 'Legal Subs'] },
  { name: 'Authorities Bundle', category: 'no-date', precision: 'none', caseTypes: ['general', 'civil', 'family'], priority: 7, aliases: ['Authorities', 'Case Law'] },
  { name: 'Expert Report - [Expert]', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 9, aliases: ['Expert'] },
  { name: 'Correspondence', category: 'month-year', precision: 'month', caseTypes: ['general', 'civil', 'family', 'employment'], priority: 6, aliases: ['Letters', 'Correspondence'] },
  { name: 'Email Correspondence', category: 'month-year', precision: 'month', caseTypes: ['general'], priority: 6, aliases: ['Emails'] },
  { name: 'Order', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 10, aliases: ['Court Order'] },
  { name: 'Draft Order', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 8, aliases: ['Draft'] },
  { name: 'Consent Order', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 9, aliases: ['Consent'] },
  { name: 'Judgment', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 10, aliases: ['Judgment', 'Reasons'] },
  { name: 'Transcript', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 8, aliases: ['Transcript', 'Hearing Transcript'] },
  { name: 'Attendance Note', category: 'full-date', precision: 'day', caseTypes: ['general'], priority: 6, aliases: ['Attendance', 'File Note'] },
  { name: 'Exhibit [Ref] - [Description]', category: 'no-date', precision: 'none', caseTypes: ['general', 'civil', 'family'], priority: 7, aliases: ['Exhibit'] },
  { name: 'First, Second, Third Party Evidence', category: 'full-date', precision: 'day', caseTypes: ['general'], priority: 7, aliases: ['First', 'Second', 'Third', 'Party Evidence'] },
  { name: 'Application for Extension of Time', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 8, aliases: ['Extension', 'Extension Time'] },
  { name: 'Notice of Hearing', category: 'full-date', precision: 'day', caseTypes: ['general'], priority: 8, aliases: ['Notice Hearing'] },
  { name: 'Case Management Order', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 9, aliases: ['CMO', 'Case Management'] },
  { name: 'Directions Order', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 9, aliases: ['Directions'] },
  { name: 'Unless Order', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil'], priority: 9, aliases: ['Unless'] },
  { name: 'Certificate of Service', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil', 'family'], priority: 7, aliases: ['Certificate Service'] },
  { name: 'Costs Budget', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil'], priority: 8, aliases: ['Precedent H', 'Budget'] },
  { name: 'Bill of Costs', category: 'full-date', precision: 'day', caseTypes: ['general', 'civil'], priority: 8, aliases: ['Bill Costs', 'Costs Bill'] },

  // Fallback
  { name: 'Custom name...', category: 'no-date', precision: 'none', caseTypes: ['general'], priority: 1, aliases: ['Other', 'Custom'] },
];

/**
 * Intelligent fuzzy search with form code recognition and word boundary matching
 */
function intelligentMatch(template: DocumentTemplate, query: string): { matches: boolean; score: number } {
  const lowerQuery = query.toLowerCase().trim();
  const lowerName = template.name.toLowerCase();
  const aliases = template.aliases || [];

  // Exact match (highest score)
  if (lowerName === lowerQuery || aliases.some(a => a.toLowerCase() === lowerQuery)) {
    return { matches: true, score: 1000 };
  }

  // Starts with query (very high score)
  if (lowerName.startsWith(lowerQuery) || aliases.some(a => a.toLowerCase().startsWith(lowerQuery))) {
    return { matches: true, score: 900 };
  }

  // Form code matching (e.g., "D11", "N244", "C100")
  const formCodeMatch = lowerQuery.match(/^([a-z]+)?(\d+)([a-z])?$/i);
  if (formCodeMatch) {
    const formPattern = new RegExp(`\\b${lowerQuery}\\b`, 'i');
    if (formPattern.test(lowerName) || aliases.some(a => formPattern.test(a))) {
      return { matches: true, score: 850 };
    }
  }

  // Word boundary start match (e.g., "Thi" matches "Third Party")
  const words = lowerName.split(/[\s\-\/\(\)]/);
  const aliasWords = aliases.flatMap(a => a.toLowerCase().split(/[\s\-\/\(\)]/));
  const allWords = [...words, ...aliasWords];

  if (allWords.some(word => word.startsWith(lowerQuery))) {
    return { matches: true, score: 800 };
  }

  // Acronym match (e.g., "CAO" matches "Child Arrangements Order")
  if (lowerQuery.length >= 2) {
    const acronym = allWords
      .map(w => w[0])
      .join('')
      .toLowerCase();
    if (acronym.includes(lowerQuery)) {
      return { matches: true, score: 750 };
    }
  }

  // Contains query in name or aliases
  if (lowerName.includes(lowerQuery) || aliases.some(a => a.toLowerCase().includes(lowerQuery))) {
    // Score based on position (earlier = higher score)
    const position = lowerName.indexOf(lowerQuery);
    const positionScore = position >= 0 ? 700 - position : 600;
    return { matches: true, score: positionScore };
  }

  // Fuzzy matching for typos (simple version - checks if most characters match)
  if (lowerQuery.length >= 3) {
    const fuzzyScore = calculateFuzzyScore(lowerQuery, lowerName);
    if (fuzzyScore > 0.6) {
      return { matches: true, score: fuzzyScore * 500 };
    }
  }

  return { matches: false, score: 0 };
}

/**
 * Calculate fuzzy matching score (simple Levenshtein-like approach)
 */
function calculateFuzzyScore(query: string, text: string): number {
  let matches = 0;
  let lastIndex = -1;

  for (const char of query) {
    const index = text.indexOf(char, lastIndex + 1);
    if (index > lastIndex) {
      matches++;
      lastIndex = index;
    }
  }

  return matches / query.length;
}

/**
 * Search templates with intelligent fuzzy matching and form code recognition
 */
export function searchTemplates(
  query: string,
  maxResults: number = 8,
  caseType?: BundleType
): DocumentTemplate[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Find all matching templates with scores
  const matchesWithScores = documentTemplates
    .map(template => {
      const match = intelligentMatch(template, query);
      return { template, ...match };
    })
    .filter(result => result.matches);

  // Sort by relevance
  const sorted = matchesWithScores.sort((a, b) => {
    // Case-type relevant templates get bonus
    const aRelevant = caseType && a.template.caseTypes.includes(caseType);
    const bRelevant = caseType && b.template.caseTypes.includes(caseType);
    const caseTypeBonus = 100;

    const aFinalScore = a.score + (aRelevant ? caseTypeBonus : 0) + a.template.priority;
    const bFinalScore = b.score + (bRelevant ? caseTypeBonus : 0) + b.template.priority;

    return bFinalScore - aFinalScore;
  });

  return sorted.slice(0, maxResults).map(result => result.template);
}

/**
 * Get templates filtered by case type
 */
export function getTemplatesByCaseType(caseType: BundleType, maxResults?: number): DocumentTemplate[] {
  const templates = documentTemplates
    .filter(template => template.caseTypes.includes(caseType))
    .sort((a, b) => b.priority - a.priority);

  return maxResults ? templates.slice(0, maxResults) : templates;
}

/**
 * Select placeholder text in a template
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
