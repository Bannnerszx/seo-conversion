// src/app/providers/AuthProviderServer.jsx
'use server'

import { cookies } from 'next/headers'
import AuthProvider from './AuthProvider'

export default async function AuthProviderServer({ children }) {
  // 1️⃣ Setup Cookie Names
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ''
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  const oldNames = OLD_NAMES_ENV.split(',').map((name) => name.trim()).filter(Boolean)
  const cookieStore = await cookies()

  // 2️⃣ Fast Synchronous Check: Legacy Cookies
  // If legacy cookies exist, we treat as guest (client side can clean them up if needed)
  for (const legacyName of oldNames) {
    if (cookieStore.get(legacyName)?.value) {
      return (
        <AuthProvider initialUser={null} hasSessionCookie={false}>
          {children}
        </AuthProvider>
      )
    }
  }

  // 3️⃣ Fast Synchronous Check: Current Cookie
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value

  // 4️⃣ Optimistic Return:
  // We DO NOT fetch /api/verify-session here. It is too slow.
  // We pass hasSessionCookie={true} so the client knows to check.
  return (
    <AuthProvider 
      initialUser={null} 
      hasSessionCookie={!!sessionCookie}
    >
      {children}
    </AuthProvider>
  )
}