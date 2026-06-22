import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    // login() is now async — calls real API
    const result = await login(form.username.trim(), form.password)
    setLoading(false)
    if (!result.success) setError(result.message)
  }

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <img src={logo} alt="UzIntellekt logo" />
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>Admin Panel</h1>
          <p>Sign in to your administrator account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8"  x2="12"   y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Username */}
          <div className="field-group">
            <label htmlFor="admin-username">Username</label>
            <div className="input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="admin-username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="field-group">
            <label htmlFor="admin-password">Password</label>
            <div className="input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="admin-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading
              ? (<><span className="btn-spinner" aria-hidden="true" /> Signing in…</>)
              : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">UzIntellekt Admin &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
