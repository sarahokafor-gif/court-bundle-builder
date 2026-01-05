import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, User, AlertCircle, CheckCircle, Loader, Shield } from 'lucide-react'
import './AuthModal.css'

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedMarketing, setAcceptedMarketing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const { login, register, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!isLogin && !acceptedTerms) {
      setError('You must accept the terms and disclaimer to register')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
        setMessage('Account created! Please check your email to verify your account.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      // Make Firebase errors more user-friendly
      if (errorMessage.includes('auth/email-already-in-use')) {
        setError('This email is already registered. Please log in instead.')
      } else if (errorMessage.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.')
      } else if (errorMessage.includes('auth/weak-password')) {
        setError('Password is too weak. Please use at least 6 characters.')
      } else if (errorMessage.includes('auth/user-not-found')) {
        setError('No account found with this email. Please register first.')
      } else if (errorMessage.includes('auth/wrong-password') || errorMessage.includes('auth/invalid-credential')) {
        setError('Incorrect password. Please try again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)

    try {
      await resetPassword(email)
      setMessage('Password reset email sent! Check your inbox.')
      setShowResetPassword(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      if (errorMessage.includes('auth/user-not-found')) {
        setError('No account found with this email.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (showResetPassword) {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <div className="auth-header">
            <h2>Reset Password</h2>
            <p>Enter your email to receive a password reset link</p>
          </div>

          <form onSubmit={handleResetPassword} className="auth-form">
            {error && (
              <div className="auth-error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {message && (
              <div className="auth-success">
                <CheckCircle size={18} />
                {message}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reset-email">
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button primary" disabled={loading}>
              {loading ? <Loader className="spinner" size={20} /> : 'Send Reset Link'}
            </button>

            <button
              type="button"
              className="auth-button secondary"
              onClick={() => setShowResetPassword(false)}
              disabled={loading}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {isLogin
              ? 'Log in to access Court Bundle Builder'
              : 'Register for free unlimited access'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {message && (
            <div className="auth-success">
              <CheckCircle size={18} />
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <Lock size={18} />
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>

              <div className="disclaimer-box">
                <div className="disclaimer-header">
                  <Shield size={18} />
                  <strong>Important Disclaimer</strong>
                </div>
                <p className="disclaimer-text">
                  This service is provided entirely free of charge. All document processing occurs
                  locally on your device - we do not store, upload, or have access to your documents.
                </p>
                <p className="disclaimer-text">
                  <strong>By using this service, you acknowledge that:</strong>
                </p>
                <ul className="disclaimer-list">
                  <li>You use this tool entirely at your own risk</li>
                  <li>We accept no responsibility for bundling errors or omissions</li>
                  <li>We accept no liability for data breaches or loss of confidentiality</li>
                  <li>You are solely responsible for verifying the accuracy of generated bundles</li>
                  <li>This tool is not a substitute for professional legal advice</li>
                </ul>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    disabled={loading}
                  />
                  <span>I accept the disclaimer and terms of use <span className="required">*</span></span>
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptedMarketing}
                    onChange={(e) => setAcceptedMarketing(e.target.checked)}
                    disabled={loading}
                  />
                  <span>I agree to receive updates and offers from Court Bundle Builder and partners (optional)</span>
                </label>
              </div>
            </>
          )}

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? (
              <Loader className="spinner" size={20} />
            ) : isLogin ? (
              <>
                <User size={20} />
                Log In
              </>
            ) : (
              <>
                <User size={20} />
                Create Account
              </>
            )}
          </button>

          {isLogin && (
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setShowResetPassword(true)}
              disabled={loading}
            >
              Forgot your password?
            </button>
          )}
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}>
                Register for free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}>
                Log in
              </button>
            </>
          )}
        </div>

        <div className="auth-benefits">
          <h3>Free Account Benefits:</h3>
          <ul>
            <li><CheckCircle size={16} /> Unlimited document bundles</li>
            <li><CheckCircle size={16} /> All features included</li>
            <li><CheckCircle size={16} /> Professional court-ready PDFs</li>
            <li><CheckCircle size={16} /> Save and reload your work</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
