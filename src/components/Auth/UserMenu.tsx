import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, LogOut, ChevronDown } from 'lucide-react'
import './UserMenu.css'

export default function UserMenu() {
  const { currentUser, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  if (!currentUser) return null

  // Get display name or email prefix
  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User'

  return (
    <div className="user-menu">
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="user-avatar">
          <User size={18} />
        </div>
        <span className="user-name">{displayName}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="user-menu-backdrop" onClick={() => setIsOpen(false)} />
          <div className="user-menu-dropdown">
            <div className="user-menu-header">
              <div className="user-email">{currentUser.email}</div>
              {currentUser.emailVerified ? (
                <span className="verified-badge">Verified</span>
              ) : (
                <span className="unverified-badge">Unverified</span>
              )}
            </div>
            <div className="user-menu-divider" />
            <button className="user-menu-item logout" onClick={handleLogout}>
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
