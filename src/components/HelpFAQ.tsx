import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Upload, FolderOpen, Eye, Pen, FileText, Trash2, GripVertical, Save, Download, Calendar, Layers } from 'lucide-react'
import './HelpFAQ.css'

interface FAQItem {
  question: string
  answer: string
  icon?: React.ReactNode
}

const faqItems: FAQItem[] = [
  {
    question: "How do I upload documents?",
    answer: "Click the 'Upload PDFs' button or drag and drop PDF files into the upload area. You can select multiple files at once. Each PDF will be added to your current section and a thumbnail preview will be generated automatically.",
    icon: <Upload size={18} />
  },
  {
    question: "How do I organise documents into sections?",
    answer: "Use the Section Manager to create sections (e.g., 'Section A - Applications', 'Section B - Statements'). Each document row has a dropdown menu where you can move it to a different section. You can also drag documents using the grip handle (⋮⋮) to reorder them within a section.",
    icon: <FolderOpen size={18} />
  },
  {
    question: "How do I reorder documents?",
    answer: "Click and hold the grip handle (⋮⋮) on the left side of any document row, then drag it to the desired position. You can also set document dates using the date picker and click 'Sort by Date' to automatically arrange documents chronologically (undated first, then oldest to newest).",
    icon: <GripVertical size={18} />
  },
  {
    question: "What does the View button do?",
    answer: "The View button opens a full-screen preview of the PDF document. You can scroll through all pages and verify the content before including it in your bundle. Click the X or press Escape to close the preview.",
    icon: <Eye size={18} />
  },
  {
    question: "What does the Redact button do?",
    answer: "The Redact tool lets you permanently mark areas of a PDF. Select 'Redact' for black boxes (to hide sensitive information) or 'Erase' for white boxes (to remove old page numbers or stamps). Draw rectangles by clicking and dragging. Click on any existing rectangle to delete it. Use the zoom and navigation controls to work on different pages. Click 'Save Edits' when done - the changes are permanently burned into the PDF.",
    icon: <Pen size={18} />
  },
  {
    question: "What does the Pages button do?",
    answer: "The Pages tool lets you select which pages to include in the final bundle. A thumbnail grid shows all pages - click to toggle selection (blue border = included, no border = excluded). This is useful for removing cover pages, blank pages, or irrelevant sections without editing the original PDF.",
    icon: <FileText size={18} />
  },
  {
    question: "How do I delete a document?",
    answer: "Click the red 'Del' button on any document row to remove it from your bundle. For bulk deletion, use the checkboxes to select multiple documents, then click 'Delete Selected'. Deleted documents are removed from the bundle but not from your computer.",
    icon: <Trash2 size={18} />
  },
  {
    question: "How do I set document dates?",
    answer: "Each document row has a date picker (📅). Click it to select the document's date. Dates help with chronological sorting - click 'Sort by Date' in the section header to automatically arrange documents. Undated documents appear first, followed by dated documents from oldest to newest.",
    icon: <Calendar size={18} />
  },
  {
    question: "What are section dividers?",
    answer: "Section dividers are coloured separator pages inserted at the start of each section in the final bundle. Enable them in the Section Manager by toggling the divider option. Dividers display the section name and help readers navigate large bundles.",
    icon: <Layers size={18} />
  },
  {
    question: "How do I save my work?",
    answer: "Click the 'Save Bundle' button to download a .json file containing all your documents, settings, and metadata. This file includes the actual PDF data (base64 encoded), so you can reload your entire bundle later without re-uploading the PDFs.",
    icon: <Save size={18} />
  },
  {
    question: "How do I load a saved bundle?",
    answer: "Click the 'Load Bundle' button and select a previously saved .json file. All your documents, sections, metadata, and settings will be restored. You can continue editing and generate the bundle when ready.",
    icon: <Download size={18} />
  },
  {
    question: "How do I generate the final bundle?",
    answer: "Once your documents are organised, click the 'Generate Bundle' button. The app will merge all PDFs, create an index page with clickable links, add page numbers, and insert any section dividers. The final PDF will download automatically. Large bundles may take a moment to process."
  },
  {
    question: "What page numbering options are available?",
    answer: "In the Page Number Settings panel, you can choose: position (top or bottom, left/center/right), font size, and whether numbers should be bold. You can also use section-based numbering (A001, B001, etc.) instead of continuous numbering (1, 2, 3...)."
  },
  {
    question: "Can I edit document names?",
    answer: "Yes! Click on the document name field in any row to edit it. The custom name will appear in the bundle index. The original filename is preserved for reference."
  },
  {
    question: "What bundle types are supported?",
    answer: "The app includes templates for Court of Protection, Family Court, Civil/Chancery, Employment Tribunal, and other common bundle formats. Select your bundle type to load pre-configured sections that match court requirements."
  }
]

export default function HelpFAQ() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setOpenItems(new Set(faqItems.map((_, i) => i)))
  }

  const collapseAll = () => {
    setOpenItems(new Set())
  }

  return (
    <div className="help-faq">
      <button
        className="help-faq-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle help and FAQ"
      >
        <HelpCircle size={20} />
        <span>Help &amp; FAQ - How to Use the Bundle Builder</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="help-faq-content">
          <div className="help-faq-header">
            <p className="help-faq-intro">
              Click any question below to see the answer. This guide covers all features of the Court Bundle Builder.
            </p>
            <div className="help-faq-actions">
              <button className="btn btn-sm btn-secondary" onClick={expandAll}>
                Expand All
              </button>
              <button className="btn btn-sm btn-secondary" onClick={collapseAll}>
                Collapse All
              </button>
            </div>
          </div>

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={index} className={`faq-item ${openItems.has(index) ? 'open' : ''}`}>
                <button
                  className="faq-question"
                  onClick={() => toggleItem(index)}
                  aria-expanded={openItems.has(index)}
                >
                  <span className="faq-icon">{item.icon || <HelpCircle size={18} />}</span>
                  <span className="faq-question-text">{item.question}</span>
                  {openItems.has(index) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openItems.has(index) && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="help-faq-footer">
            <p>
              <strong>Need more help?</strong> Contact support or check the Bundle Requirements Guide for court-specific formatting rules.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
