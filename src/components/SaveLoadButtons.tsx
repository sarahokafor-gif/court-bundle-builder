import { useRef, useState } from 'react'
import { Save, FolderOpen } from 'lucide-react'
import './SaveLoadButtons.css'

interface SaveLoadButtonsProps {
  onSave: () => Promise<void>
  onLoad: (file: File) => Promise<void>
}

export default function SaveLoadButtons({ onSave, onLoad }: SaveLoadButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
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

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid bundle save file (.json)')
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
        className="action-button save-button"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Save size={18} />
        {isSaving ? 'Saving...' : 'Save Work'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        className="action-button load-button"
        onClick={handleLoadClick}
        disabled={isLoading}
      >
        <FolderOpen size={18} />
        {isLoading ? 'Loading...' : 'Load Work'}
      </button>
    </div>
  )
}
