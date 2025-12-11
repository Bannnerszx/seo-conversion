// src/app/providers/AuthProviderServer.jsx
'use server'

import { cookies } from 'next/headers'
import { admin } from "@/lib/firebaseAdmin"; // Ensure you have this admin export
import AuthProvider from './AuthProvider'

export default async function AuthProviderServer({ children }) {
  const cookieStore = await cookies()
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'session'
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value

  let initialUser = null;
  let hasSessionCookie = false;

  // ⚡️ SERVER-SIDE AUTH CHECK
  // Verify the cookie immediately so we can render the "Logged In" header via SSR.
  if (sessionCookie) {
    hasSessionCookie = true;
    try {
      // Verify session cookie using Firebase Admin
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      
      // If valid, set the initial user (email is needed for your Header)
      if (decodedClaims) {
        initialUser = decodedClaims.email || null;
      }
    } catch (error) {
      // If verification fails (expired/invalid), we treat as guest
      // console.error("Server Auth Verify Failed:", error);
      initialUser = null;
    }
  }

  // Pass the verified 'initialUser' down to the client provider
  return (
    <AuthProvider 
      initialUser={initialUser} 
      hasSessionCookie={hasSessionCookie}
    >
      {children}
    </AuthProvider>
  )
}