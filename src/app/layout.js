// app/layout.js

export const dynamic = 'force-dynamic'

import { Geist, Geist_Mono } from "next/font/google"
import { fetchCurrency } from "../../services/fetchFirebaseData"
import "./globals.css"
import { CurrencyProvider } from "@/providers/CurrencyContext"
import ClientLayoutWrapper from "./ClientLayoutWrapper"
import AuthProviderServer from "./providers/AuthProviderServer"
import Providers from "./ProgressProvider"
import { cookies } from "next/headers"
import Script from "next/script"
import { fetchNotificationCounts } from "./actions/actions"
import ClientAppCheck from "../../firebase/ClientAppCheck"
import { BannerProvider } from "./components/BannerContext"
import { IpInfoProvider } from "@/providers/IpInfoContext";
import ZambiaChecker from "./components/ZambiaChecker"
import SafeCssScanner from "./components/SafeCssScanner"
import PayPalBanner from "./components/PaypalPopup"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "REAL MOTOR JAPAN",
  description:
    "Established in 1979, offering affordable and quality used vehicles sourced in Japan.",
  keywords: [
    "cars",
    "export",
    "Real Motor Japan",
    "Japan",
    "Toyota",
    "Honda",
    "RMJ",
    "Nissan",
    "Honda",
    "trucks",
    "Suzuki",
    "Mitsubishi",
    "Subaru",
  ],
}

export default async function RootLayout({ children }) {
  // 1️⃣  Always fetch currency
  const currency = (await fetchCurrency()) || []

  // 2️⃣  Read cookies (we only read, never delete/set here)
  const cookieStore = await cookies()

  // 3️⃣  Check for legacy "session" (guest if present, but do not delete here)
  const hasOldSession = !!cookieStore.get('session')?.value

  // 4️⃣  Read only "session_v2"
  const sessionCookie = cookieStore.get('session_v2')?.value

  // 5️⃣  Default to “guest” values
  let isValid = false
  let userEmail = null
  let notificationCount = null

  // 6️⃣  If session_v2 exists, verify it via /api/verify-session
  if (sessionCookie) {
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://www.realmotor.jp'
      const verifyRes = await fetch(`${origin}/api/verify-session`, {
        method: 'GET',
        headers: {
          cookie: `session_v2=${sessionCookie}`,
        },

        next: {
          revalidate: 60 // Re-verify the session at most once per minute
        }
      });

      const apiJson = await verifyRes.json()
      if (apiJson.valid) {
        isValid = true
        userEmail = apiJson.claims.email || null
        notificationCount = await fetchNotificationCounts({ userEmail })
      }
      // If valid===false, /api/verify-session already cleared session_v2 for us
    } catch (err) {
      console.error('[RootLayout] /api/verify-session error:', err)
      isValid = false
    }
  }





  // 7️⃣  Render the <html>… layout:
  //     • If hasOldSession but no valid session_v2 → we still treat as guest (no deletion here).
  //     • If session_v2 is invalid or missing → guest UI.
  //     • If session_v2 is valid → authenticated UI.
  return (
    <html lang="en">
      <head>
        {/* 1) GTM head script */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'\u0026l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-NJLD22H');`,
          }}
        />
        <link
          rel="preload"
          href="https://real-motor-japan.firebaseapp.com/__/auth/iframe.js"
          as="script"
          crossOrigin="anonymous"
        />
      </head>

      <link
        rel="preload"
        as="image"
        href="/samplebanner3.webp"
        media="(max-width: 640px)"
      />

      <body className={`${geistSans.variable} ${geistMono.variable}`}>
 
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NJLD22H"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <SafeCssScanner />
        <ClientAppCheck />

        <IpInfoProvider>
          <ZambiaChecker />
          <PayPalBanner />
          {/* 
            Wrap everything in AuthProviderServer. 
            • If isValid===false (or there was that old session), we pass decodedToken={null}. 
            • If isValid===true, we pass decodedToken={userEmail}. 
          */}
          <AuthProviderServer decodedToken={isValid ? userEmail : null}>
            <Providers>
              <CurrencyProvider currency={currency}>
                <ClientLayoutWrapper
                  counts={notificationCount}
                  userEmail={isValid ? userEmail : null}
                  currency={currency}
                >
                  <BannerProvider>

                    {children}
                  </BannerProvider>
                </ClientLayoutWrapper>
              </CurrencyProvider>
            </Providers>
          </AuthProviderServer>
        </IpInfoProvider>

        <Script
          id="firebase-auth-iframe"
          src="https://real-motor-japan.firebaseapp.com/__/auth/iframe.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}