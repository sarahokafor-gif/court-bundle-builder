import { useState } from 'react'
import { FileText, Briefcase, Users, Scale, Building2, Heart, ChevronRight } from 'lucide-react'
import { Section, BundleType } from '../types'
import './TemplateSelector.css'

interface TemplateConfig {
  id: BundleType
  name: string
  description: string
  icon: React.ReactNode
  sections: Array<{
    name: string
    pagePrefix: string
  }>
}

const BUNDLE_TEMPLATES: TemplateConfig[] = [
  {
    id: 'family',
    name: 'Family Proceedings',
    description: 'For family court applications, contact disputes, and financial remedy',
    icon: <Heart size={24} />,
    sections: [
      { name: 'Applications & Orders', pagePrefix: 'A' },
      { name: 'Position Statements', pagePrefix: 'B' },
      { name: 'Witness Statements', pagePrefix: 'C' },
      { name: 'Expert Reports', pagePrefix: 'D' },
      { name: 'Correspondence', pagePrefix: 'E' },
      { name: 'Other Documents', pagePrefix: 'F' },
    ],
  },
  {
    id: 'civil',
    name: 'Civil Litigation',
    description: 'For county court and High Court civil claims',
    icon: <Scale size={24} />,
    sections: [
      { name: 'Statements of Case', pagePrefix: 'A' },
      { name: 'Court Orders', pagePrefix: 'B' },
      { name: 'Witness Statements', pagePrefix: 'C' },
      { name: 'Expert Reports', pagePrefix: 'D' },
      { name: 'Disclosed Documents', pagePrefix: 'E' },
      { name: 'Correspondence', pagePrefix: 'F' },
    ],
  },
  {
    id: 'employment',
    name: 'Employment Tribunal',
    description: 'For unfair dismissal, discrimination, and employment claims',
    icon: <Briefcase size={24} />,
    sections: [
      { name: 'ET1 & ET3', pagePrefix: 'A' },
      { name: 'Witness Statements', pagePrefix: 'B' },
      { name: 'Contract & Policies', pagePrefix: 'C' },
      { name: 'Correspondence', pagePrefix: 'D' },
      { name: 'Disclosed Documents', pagePrefix: 'E' },
    ],
  },
  {
    id: 'tribunal',
    name: 'First-tier Tribunal',
    description: 'For immigration, tax, and social security appeals',
    icon: <Building2 size={24} />,
    sections: [
      { name: 'Decision Under Appeal', pagePrefix: 'A' },
      { name: 'Grounds of Appeal', pagePrefix: 'B' },
      { name: 'Supporting Evidence', pagePrefix: 'C' },
      { name: 'Expert Reports', pagePrefix: 'D' },
      { name: 'Correspondence', pagePrefix: 'E' },
    ],
  },
  {
    id: 'court-of-protection',
    name: 'Court of Protection',
    description: 'For deputyship applications and welfare decisions',
    icon: <Users size={24} />,
    sections: [
      { name: 'Application Forms', pagePrefix: 'A' },
      { name: 'Capacity Assessments', pagePrefix: 'B' },
      { name: 'Care Plans', pagePrefix: 'C' },
      { name: 'Medical Records', pagePrefix: 'D' },
      { name: 'Witness Statements', pagePrefix: 'E' },
      { name: 'Other Documents', pagePrefix: 'F' },
    ],
  },
  {
    id: 'inquest',
    name: 'Inquest/Coroner',
    description: 'For coronial proceedings and inquests',
    icon: <FileText size={24} />,
    sections: [
      { name: 'Statements', pagePrefix: 'A' },
      { name: 'Medical Records', pagePrefix: 'B' },
      { name: 'Expert Reports', pagePrefix: 'C' },
      { name: 'Disclosure', pagePrefix: 'D' },
      { name: 'Correspondence', pagePrefix: 'E' },
    ],
  },
]

interface TemplateSelectorProps {
  onSelectTemplate: (sections: Section[], bundleType: BundleType) => void
  currentSectionCount: number
  currentDocCount: number
}

export default function TemplateSelector({
  onSelectTemplate,
  currentSectionCount,
  currentDocCount,
}: TemplateSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<BundleType | null>(null)

  const handleSelectTemplate = (template: TemplateConfig) => {
    // Create sections from template
    const newSections: Section[] = template.sections.map((section, index) => ({
      id: `section-${Date.now()}-${index}`,
      name: section.name,
      documents: [],
      addDivider: index > 0, // Add dividers between sections
      order: index,
      pagePrefix: section.pagePrefix,
      startPage: 1,
    }))

    setSelectedTemplate(template.id)
    onSelectTemplate(newSections, template.id)
    setIsExpanded(false)
  }

  const hasExistingWork = currentSectionCount > 1 || currentDocCount > 0

  return (
    <div className="template-selector">
      <button
        className="template-selector-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="toggle-content">
          <FileText size={20} />
          <div className="toggle-text">
            <span className="toggle-title">Quick Start Templates</span>
            <span className="toggle-hint">
              {selectedTemplate
                ? `Using: ${BUNDLE_TEMPLATES.find(t => t.id === selectedTemplate)?.name}`
                : 'Pre-configured sections for common bundle types'}
            </span>
          </div>
        </div>
        <ChevronRight
          size={20}
          className={`toggle-chevron ${isExpanded ? 'expanded' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="template-grid">
          {hasExistingWork && (
            <div className="template-warning">
              <strong>Note:</strong> Selecting a template will replace your current sections.
              Documents will need to be re-uploaded.
            </div>
          )}

          {BUNDLE_TEMPLATES.map(template => (
            <button
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="template-icon">{template.icon}</div>
              <div className="template-info">
                <h4 className="template-name">{template.name}</h4>
                <p className="template-description">{template.description}</p>
                <div className="template-sections">
                  {template.sections.length} sections: {template.sections.map(s => s.pagePrefix).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
