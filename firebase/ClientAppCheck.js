'use client'
import { useEffect } from 'react'
import { firebaseApp } from './clientApp'
import { getAppCheckToken } from '@/app/actions/actions'
import {
  initializeAppCheck,
  CustomProvider,
  onTokenChanged,
  setTokenAutoRefreshEnabled
} from 'firebase/app-check'

export default function ClientAppCheck() {
  useEffect(() => {
    // 1) create & install your custom provider
    const provider = new CustomProvider({
      getToken: async () => {
        const { appCheckToken, expiresAt } = await getAppCheckToken({
          appId: '1:854100669672:web:c224be87d85439b5af855d'
        })
        return {
          token: appCheckToken,
          expireTimeMillis: expiresAt * 1000
        }
      }
    })

    // 2) initialize App Check (bundled in main.js now)
    const appCheckInstance = initializeAppCheck(firebaseApp, {
      provider,
      isTokenAutoRefreshEnabled: true
    })

    // 3) optional: listen for token changes
    const unsubscribe = onTokenChanged(appCheckInstance, token => {
      console.log('App Check token:')
    })

    return () => {
      unsubscribe()
      setTokenAutoRefreshEnabled(appCheckInstance, false)
    }
  }, [])

  return null
}
