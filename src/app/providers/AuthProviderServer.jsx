// app/AuthProviderServer.jsx
'use server'

import { cookies } from 'next/headers'
import AuthProvider from './AuthProvider'

export default async function AuthProviderServer({ children }) {
  // 1️⃣ Read comma-separated list of all legacy cookie names and the current cookie name
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ''
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  // 2️⃣ Turn the legacy names into an array
  const oldNames = OLD_NAMES_ENV
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  // 3️⃣ Read cookies() synchronously (no await)
  const cookieStore = await cookies()

  // 4️⃣ If any legacy cookie still exists, render as guest immediately
  for (const legacyName of oldNames) {
    if (cookieStore.get(legacyName)?.value) {
      return <AuthProvider decodedToken={null}>{children}</AuthProvider>
    }
  }

  // 5️⃣ Read only the current cookie
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value

  // 6️⃣ If there’s no current cookie, render guest
  if (!sessionCookie) {
    return <AuthProvider decodedToken={null}>{children}</AuthProvider>
  }

  // 7️⃣ Call /api/verify-session to check the current cookie
  let apiJson = { valid: false }
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verifyRes = await fetch(`${origin}/api/verify-session`, {
      method: 'GET',
      headers: {
        // Forward only the current cookie name so the API can read it
        cookie: `${COOKIE_NAME}=${sessionCookie}`,
      },
      next: {
        revalidate: 60
      }
    })
    apiJson = await verifyRes.json()
  } catch (err) {
    console.error('[AuthProviderServer] /api/verify-session failed:', err)
    apiJson = { valid: false }
  }

  // 8️⃣ If invalid, render guest (verify-session route will have deleted it)
  if (!apiJson.valid) {
    return <AuthProvider decodedToken={null}>{children}</AuthProvider>
  }

  // 9️⃣ If valid, extract the user’s email and render authenticated
  const userEmail = apiJson.claims.email || null
  return <AuthProvider decodedToken={userEmail}>{children}</AuthProvider>
}
