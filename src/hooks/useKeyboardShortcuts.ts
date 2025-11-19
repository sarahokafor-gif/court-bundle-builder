import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
  preventDefault?: boolean
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: KeyboardShortcut[]
}

/**
 * Custom hook for managing keyboard shortcuts
 * Handles both Ctrl (Windows/Linux) and Cmd (Mac) modifiers
 */
export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field (exclude shortcuts in inputs)
      const target = event.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()

        // Handle modifier keys (Ctrl on Windows/Linux, Cmd on Mac)
        const ctrlOrMetaPressed = shortcut.ctrlKey || shortcut.metaKey
          ? (event.ctrlKey || event.metaKey)
          : (!event.ctrlKey && !event.metaKey)

        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey

        if (keyMatches && ctrlOrMetaPressed && shiftMatches && altMatches) {
          // For some shortcuts, allow them even in input fields (like Cmd+S for save)
          const allowInInputs = ['s', 'g', 'i'].includes(shortcut.key.toLowerCase())

          if (!isInputField || allowInInputs) {
            if (shortcut.preventDefault !== false) {
              event.preventDefault()
            }
            shortcut.action()
            break
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, shortcuts])
}

/**
 * Get the appropriate modifier key label based on platform
 */
export function getModifierKey(): 'Ctrl' | 'Cmd' {
  return navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl'
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  const modifier = getModifierKey()

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(modifier)
  }
  if (shortcut.shiftKey) {
    parts.push('Shift')
  }
  if (shortcut.altKey) {
    parts.push('Alt')
  }
  parts.push(shortcut.key.toUpperCase())

  return parts.join('+')
}
