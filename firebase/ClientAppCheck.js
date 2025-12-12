'use client'
import { useEffect } from 'react'
import { getAppCheckToken } from '@/app/actions/actions'
// 1. REMOVED: Top-level imports of firebase/app-check and clientApp to prevent blocking the main thread.

export default function ClientAppCheck() {
  useEffect(() => {
    let unsubscribe
    let appCheckInstance
    let setTokenAutoRefreshEnabledFn

    const initFirebaseAppCheck = async () => {
      try {
        // 2. DYNAMIC IMPORTS: Fetch SDKs only when the component mounts
        const { firebaseApp } = await import('./clientApp')
        const {
          initializeAppCheck,
          CustomProvider,
          onTokenChanged,
          setTokenAutoRefreshEnabled
        } = await import('firebase/app-check')

        // Capture the function for cleanup usage later
        setTokenAutoRefreshEnabledFn = setTokenAutoRefreshEnabled

        // 3. Setup Custom Provider (Logic preserved from your DEV block)
        const provider = new CustomProvider({
          getToken: async () => {
            const { appCheckToken, expiresAt } = await getAppCheckToken({
              // Use your DEV App ID (swapped from your snippet)
              appId: '1:879567069316:web:1208cd45c8b20ca6aba2d1' 
              // For PROD, you would switch to: '1:854100669672:web:c224be87d85439b5af855d'
            })
            return {
              token: appCheckToken,
              expireTimeMillis: expiresAt * 1000
            }
          }
        })

        // 4. Initialize App Check
        appCheckInstance = initializeAppCheck(firebaseApp, {
          provider,
          isTokenAutoRefreshEnabled: true
        })

        // 5. Subscribe to token changes
        unsubscribe = onTokenChanged(appCheckInstance, (token) => {
           // console.log('App Check token:', token)
        })

      } catch (error) {
        console.error('Failed to initialize App Check:', error)
      }
    }

    // Trigger the async initialization
    initFirebaseAppCheck()

    // Cleanup function
    return () => {
      if (unsubscribe) unsubscribe()
      if (appCheckInstance && setTokenAutoRefreshEnabledFn) {
        setTokenAutoRefreshEnabledFn(appCheckInstance, false)
      }
    }
  }, [])

  return null
}