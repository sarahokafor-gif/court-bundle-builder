import { useRef, useState } from 'react'
import { Save, FolderOpen } from 'lucide-react'
import './SaveLoadButtons.css'

interface SaveLoadButtonsProps {
  onSave: (filename?: string) => Promise<void>
  onLoad: (file: File) => Promise<void>
  suggestedFilename?: string
}

export default function SaveLoadButtons({ onSave, onLoad, suggestedFilename }: SaveLoadButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    // Prompt user for filename
    const defaultName = suggestedFilename || 'my_bundle_save'
    const userFilename = prompt(
      'Enter a name for your saved bundle:\n(The .cbz extension will be added automatically - new ZIP format, faster and smaller)',
      defaultName
    )

    // User cancelled the prompt
    if (userFilename === null) return

    // User entered a blank name
    if (userFilename.trim() === '') {
      alert('Please enter a valid filename')
      return
    }

    setIsSaving(true)
    try {
      await onSave(userFilename.trim())
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save bundle. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const isValidFile = fileName.endsWith('.json') || fileName.endsWith('.cbz') || fileName.endsWith('.zip')

    if (!isValidFile) {
      alert('Please select a valid bundle save file (.cbz, .zip, or .json)')
      return
    }

    setIsLoading(true)
    try {
      await onLoad(file)
    } catch (error) {
      console.error('Error loading:', error)
      alert('Failed to load bundle. The file may be corrupted or invalid.')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="save-load-buttons">
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={isSaving}
        title="Save your bundle progress as a .cbz file (ZIP format - smaller and faster)"
        aria-label="Save work progress"
      >
        <Save size={18} />
        {isSaving ? 'Saving...' : 'Save Progress'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".cbz,.zip,.json,application/zip,application/json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Load saved bundle file"
      />

      <button
        className="btn btn-success"
        onClick={handleLoadClick}
        disabled={isLoading}
        title="Load a previously saved bundle (.cbz, .zip, or .json file)"
        aria-label="Load saved bundle"
      >
        <FolderOpen size={18} />
        {isLoading ? 'Loading...' : 'Load Saved Work'}
      </button>
    </div>
  )
}
