import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login, notice } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(await login(form.get('u'), form.get('p')))
    setBusy(false)
  }

  const message = error || notice

  return (
    <div className="lg">
      <div className="lgl">
        <h1>Hospital Management System</h1>
        <p>Patients, appointments, laboratory, pharmacy and billing in one place.</p>
        <svg className="ecg" viewBox="0 0 400 80" aria-hidden="true">
          <path pathLength="1" d="M0 40H120l10-6 8 6h20l8-34 12 68 10-34h30l10-8 10 8H400" />
        </svg>
      </div>
      <form onSubmit={submit}>
        <h2>Sign in</h2>
        {message && <p className="err" role="alert">{message}</p>}
        <label>Username<input name="u" autoComplete="username" required /></label>
        <label>Password<input name="p" type="password" autoComplete="current-password" required /></label>
        <button className="pri" disabled={busy}>Sign in</button>
        <p className="hint">
          Demo accounts: admin, doctor, nurse, reception, lab, pharmacy, accounts.
          The password is the username followed by 123.
        </p>
      </form>
    </div>
  )
}
