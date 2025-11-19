import { useState, useMemo, useRef, useImperativeHandle, forwardRef } from 'react'
import { Search, X, FileText, Folder } from 'lucide-react'
import { Section, Document } from '../types'
import './SearchFilter.css'

interface SearchFilterProps {
  sections: Section[]
  onDocumentClick?: (sectionId: string, docId: string) => void
}

export interface SearchFilterRef {
  focus: () => void
}

interface SearchResult {
  document: Document
  section: Section
  matchType: 'name' | 'title'
  matchText: string
}

const SearchFilter = forwardRef<SearchFilterRef, SearchFilterProps>(
  ({ sections, onDocumentClick }, ref) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all')
    const [isExpanded, setIsExpanded] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Expose focus method via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        searchInputRef.current?.focus()
        setIsExpanded(true)
      },
    }))

  // Calculate total documents
  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)

  // Perform search across all sections
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && selectedSectionFilter === 'all') {
      return []
    }

    const query = searchQuery.toLowerCase().trim()
    const results: SearchResult[] = []

    sections.forEach(section => {
      // Filter by section if specified
      if (selectedSectionFilter !== 'all' && section.id !== selectedSectionFilter) {
        return
      }

      section.documents.forEach(doc => {
        // Search in document name
        const docName = doc.name.toLowerCase()
        const customTitle = doc.customTitle?.toLowerCase() || ''

        let matchType: 'name' | 'title' | null = null
        let matchText = ''

        if (!query || docName.includes(query)) {
          matchType = 'name'
          matchText = doc.name
        } else if (customTitle.includes(query)) {
          matchType = 'title'
          matchText = doc.customTitle || doc.name
        }

        if (matchType || !query) {
          results.push({
            document: doc,
            section,
            matchType: matchType || 'name',
            matchText: matchText || doc.name,
          })
        }
      })
    })

    return results
  }, [searchQuery, selectedSectionFilter, sections])

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedSectionFilter('all')
  }

  const handleDocumentClick = (result: SearchResult) => {
    if (onDocumentClick) {
      onDocumentClick(result.section.id, result.document.id)
      // Scroll to the document in the list
      const docElement = document.querySelector(`[data-document-id="${result.document.id}"]`)
      if (docElement) {
        docElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add temporary highlight effect
        docElement.classList.add('highlight-pulse')
        setTimeout(() => {
          docElement.classList.remove('highlight-pulse')
        }, 2000)
      }
    }
  }

  // Don't show if no documents
  if (totalDocs === 0) {
    return null
  }

  const showResults = isExpanded && (searchQuery.trim() || selectedSectionFilter !== 'all')

  return (
    <div className="search-filter">
      <div className="search-filter-controls">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder={`Search across ${totalDocs} documents...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsExpanded(true)
            }}
            onFocus={() => setIsExpanded(true)}
            aria-label="Search documents"
          />
          {(searchQuery || selectedSectionFilter !== 'all') && (
            <button
              className="clear-search-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Section Filter */}
        <div className="section-filter-wrapper">
          <Folder size={18} className="filter-icon" />
          <select
            className="section-filter"
            value={selectedSectionFilter}
            onChange={(e) => {
              setSelectedSectionFilter(e.target.value)
              setIsExpanded(true)
            }}
            aria-label="Filter by section"
          >
            <option value="all">All Sections ({totalDocs})</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                {section.name} ({section.documents.length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="search-results">
          <div className="search-results-header">
            <span className="results-count">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </span>
            <button
              className="collapse-results-btn"
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse results"
            >
              Collapse
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="no-results">
              <FileText size={32} className="no-results-icon" />
              <p>No documents found</p>
              {searchQuery && (
                <p className="no-results-hint">
                  Try searching for a different term or check a different section
                </p>
              )}
            </div>
          ) : (
            <div className="results-list">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.section.id}-${result.document.id}-${index}`}
                  className="result-item"
                  onClick={() => handleDocumentClick(result)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleDocumentClick(result)
                    }
                  }}
                >
                  <div className="result-icon">
                    <FileText size={18} />
                  </div>
                  <div className="result-details">
                    <div className="result-name">
                      {highlightMatch(result.matchText, searchQuery)}
                    </div>
                    <div className="result-meta">
                      <span className="result-section">
                        <Folder size={12} />
                        {result.section.name}
                      </span>
                      {result.document.pageCount && (
                        <span className="result-pages">
                          {result.document.pageCount} {result.document.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                      )}
                      {result.document.documentDate && (
                        <span className="result-date">
                          {new Date(result.document.documentDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

SearchFilter.displayName = 'SearchFilter'

export default SearchFilter

// Helper function to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text
  }

  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) {
    return text
  }

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return (
    <>
      {before}
      <mark className="search-highlight">{match}</mark>
      {after}
    </>
  )
}
