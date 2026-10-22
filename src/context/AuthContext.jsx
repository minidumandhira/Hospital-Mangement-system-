import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useData } from './DataContext'
import { ACCESS, PORTAL_SCREENS } from '../config/roles'
import { hash, newId } from '../utils'

const AuthContext = createContext(null)
const IDLE_MS = 15 * 60 * 1000 // automatic session timeout

export function AuthProvider({ children }) {
  const { db, add, audit, actorRef } = useData()
  const [uid, setUid] = useState(() => sessionStorage.getItem('hms-uid'))
  const [notice, setNotice] = useState('')
  const user = db.users.find((u) => u.id === uid) || null

  actorRef.current = user ? user.username : '-'

  const logout = useCallback((message = '') => {
    audit('Signed out')
    sessionStorage.removeItem('hms-uid')
    setUid(null)
    setNotice(message)
  }, [audit])

  // Returns an error message, or '' on success.
  const login = async (username, password) => {
    const found = db.users.find((u) => u.username === username.trim().toLowerCase())
    if (!found || found.pw !== (await hash(password))) {
      audit('Failed sign-in for ' + username)
      return 'Username or password is incorrect.'
    }
    actorRef.current = found.username
    audit('Signed in')
    sessionStorage.setItem('hms-uid', found.id)
    setNotice('')
    setUid(found.id)
    return ''
  }

  // Patients create their own account. This makes a patient record and a login linked to it.
  // Returns an error message, or '' on success.
  const register = async ({ name, dob, phone, username, password }) => {
    const uname = username.trim().toLowerCase()
    if (db.users.some((u) => u.username === uname)) return 'That username is taken. Choose another.'
    if (password.length < 6) return 'Use a password of at least 6 characters.'
    const patientId = newId()
    const userId = newId()
    actorRef.current = uname
    add('patients', { id: patientId, name: name.trim(), dob, gender: '', phone, blood: '', address: '', allergies: '' }, 'Patient registered online')
    add('users', { id: userId, username: uname, name: name.trim(), role: 'patient', patient: patientId, pw: await hash(password) }, 'Patient account created')
    sessionStorage.setItem('hms-uid', userId)
    setNotice('')
    setUid(userId)
    return ''
  }

  // Sign out after 15 minutes without activity.
  useEffect(() => {
    if (!user) return
    let timer
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => logout('You were signed out after 15 minutes of inactivity.'), IDLE_MS)
    }
    const events = ['click', 'keydown', 'mousemove', 'touchstart']
    events.forEach((e) => addEventListener(e, reset))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => removeEventListener(e, reset))
    }
  }, [user, logout])

  const can = (key) => {
    if (!user) return false
    if (PORTAL_SCREENS.includes(key)) return user.role === 'patient'
    return ACCESS[user.role] === 'all' || ACCESS[user.role].includes(key)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, can, notice }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
