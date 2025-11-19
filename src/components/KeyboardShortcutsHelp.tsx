import { X, Keyboard } from 'lucide-react'
import { getModifierKey } from '../hooks/useKeyboardShortcuts'
import './KeyboardShortcutsHelp.css'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null

  const modifier = getModifierKey()

  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: [`${modifier}+S`], description: 'Save bundle progress' },
        { keys: [`${modifier}+G`], description: 'Generate bundle PDF' },
        { keys: [`${modifier}+I`], description: 'Generate index only' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Escape'], description: 'Close modals / Deselect all' },
      ],
    },
    {
      category: 'Document Management',
      items: [
        { keys: [`${modifier}+F`], description: 'Focus search filter' },
        { keys: [`${modifier}+A`], description: 'Select all documents' },
        { keys: [`${modifier}+D`], description: 'Deselect all documents' },
        { keys: ['Delete', 'Backspace'], description: 'Delete selected documents' },
      ],
    },
  ]

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div className="keyboard-shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-shortcuts-header">
          <div className="keyboard-shortcuts-title">
            <Keyboard size={24} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            <X size={20} />
          </button>
        </div>

        <div className="keyboard-shortcuts-content">
          {shortcuts.map((category) => (
            <div key={category.category} className="shortcut-category">
              <h3>{category.category}</h3>
              <div className="shortcut-list">
                {category.items.map((item, index) => (
                  <div key={index} className="shortcut-item">
                    <div className="shortcut-keys">
                      {item.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="key">{key}</kbd>
                          {keyIndex < item.keys.length - 1 && (
                            <span className="key-separator">or</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="shortcut-description">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="keyboard-shortcuts-footer">
          <p>
            Press <kbd className="key">?</kbd> or <kbd className="key">Escape</kbd> to close this dialog
          </p>
        </div>
      </div>
    </div>
  )
}
