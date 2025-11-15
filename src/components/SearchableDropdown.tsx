import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import './SearchableDropdown.css'

export interface CategoryOption {
  categoryName: string
  categoryIcon: string
  options: string[]
}

interface SearchableDropdownProps {
  options?: string[]
  categorizedOptions?: CategoryOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  customOptionLabel?: string
  onCustomSelected?: () => void
  label?: string
  id?: string
}

export default function SearchableDropdown({
  options,
  categorizedOptions,
  value,
  onChange,
  placeholder = 'Click to search or select',
  customOptionLabel = 'Custom (Enter Your Own)',
  onCustomSelected,
  label,
  id,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Flatten categorized options for filtering and navigation
  const flattenedOptions = categorizedOptions
    ? categorizedOptions.flatMap(cat => cat.options)
    : options || []

  // Filter options based on search term
  const filteredFlatOptions = searchTerm
    ? flattenedOptions.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : flattenedOptions

  // Filter categories to only show those with matching options
  const filteredCategories = categorizedOptions && searchTerm
    ? categorizedOptions
        .map(cat => ({
          ...cat,
          options: cat.options.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter(cat => cat.options.length > 0)
    : categorizedOptions

  // For flat options (backward compatibility)
  const filteredOptions = options && searchTerm
    ? options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Add custom option at the end if provided
  const displayOptions = !categorizedOptions && onCustomSelected && filteredOptions
    ? [...filteredOptions, customOptionLabel]
    : filteredOptions || []

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
      setHighlightedIndex(0)
    }
  }

  const handleSelect = (option: string) => {
    if (option === customOptionLabel && onCustomSelected) {
      onCustomSelected()
      setIsOpen(false)
      setSearchTerm('')
    } else {
      onChange(option)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    // Build array of selectable options for keyboard navigation
    const selectableOptions = categorizedOptions
      ? [...filteredFlatOptions, ...(onCustomSelected ? [customOptionLabel] : [])]
      : displayOptions

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < selectableOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : selectableOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectableOptions[highlightedIndex]) {
          handleSelect(selectableOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        break
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(0)
  }

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="searchable-dropdown-label">
          {label}
        </label>
      )}

      <div
        className={`searchable-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-label={label || placeholder}
      >
        <div className="searchable-dropdown-value">
          {value || <span className="placeholder">{placeholder}</span>}
        </div>
        <div className="searchable-dropdown-icons">
          {value && (
            <button
              className="clear-button"
              onClick={handleClear}
              aria-label="Clear selection"
              type="button"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={18}
            className={`chevron ${isOpen ? 'rotate' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div
          className="searchable-dropdown-menu"
          role="listbox"
          id={id ? `${id}-listbox` : undefined}
        >
          <div className="searchable-dropdown-search">
            <Search size={16} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Type to filter or scroll to select..."
              className="search-input"
              aria-label="Filter options"
            />
          </div>

          <div className="searchable-dropdown-options">
            {categorizedOptions ? (
              // Categorized options rendering
              <>
                {filteredCategories && filteredCategories.length > 0 ? (
                  <>
                    {filteredCategories.map((category, catIndex) => (
                      <div key={catIndex} role="group" aria-label={category.categoryName}>
                        <div className="category-header">
                          <span className="category-icon">{category.categoryIcon}</span>
                          <span className="category-name">{category.categoryName}</span>
                        </div>
                        {category.options.map((option) => {
                          const globalIndex = filteredFlatOptions.indexOf(option)
                          return (
                            <div
                              key={option}
                              className={`searchable-dropdown-option ${
                                globalIndex === highlightedIndex ? 'highlighted' : ''
                              } ${option === value ? 'selected' : ''}`}
                              onClick={() => handleSelect(option)}
                              role="option"
                              aria-selected={option === value}
                            >
                              {option}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                    {onCustomSelected && (
                      <div
                        className={`searchable-dropdown-option custom-option ${
                          filteredFlatOptions.length === highlightedIndex ? 'highlighted' : ''
                        }`}
                        onClick={() => handleSelect(customOptionLabel)}
                        role="option"
                        aria-selected={false}
                      >
                        {customOptionLabel}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-results">No matching options found</div>
                )}
              </>
            ) : (
              // Flat options rendering (backward compatibility)
              <>
                {displayOptions.length === 0 ? (
                  <div className="no-results">No matching options found</div>
                ) : (
                  displayOptions.map((option, index) => (
                    <div
                      key={option}
                      className={`searchable-dropdown-option ${
                        index === highlightedIndex ? 'highlighted' : ''
                      } ${option === value ? 'selected' : ''} ${
                        option === customOptionLabel ? 'custom-option' : ''
                      }`}
                      onClick={() => handleSelect(option)}
                      role="option"
                      aria-selected={option === value}
                    >
                      {option}
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          <div className="searchable-dropdown-hint">
            💡 Tip: Type to filter or scroll through all options
          </div>
        </div>
      )}
    </div>
  )
}
