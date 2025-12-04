// app/layout.js

import { GoogleTagManager } from "@next/third-parties/google"
import { Geist, Geist_Mono } from "next/font/google"
import { fetchCurrency } from "../../services/fetchFirebaseData"
import "./globals.css"
import { CurrencyProvider } from "@/providers/CurrencyContext"
import ClientLayoutWrapper from "./ClientLayoutWrapper"
import AuthProviderServer from "./providers/AuthProviderServer"
import Providers from "./ProgressProvider"
import Script from "next/script"
import ClarityScript from "./components/ClarityScript"
import ClientAppCheckWrapper from "../../firebase/ClientAppCheckWrapper"
import { BannerProvider } from "./components/BannerContext"
import { IpInfoProvider } from "@/providers/IpInfoContext";
import ZambiaChecker from "./components/ZambiaChecker"
import SafeCssScanner from "./components/SafeCssScanner"
import PayPalBanner from "./components/PaypalPopup"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap'
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap'
})

export const metadata = {

  metadataBase: new URL('https://dev.realmotor.jp'),

  title: {
    default: "REAL MOTOR JAPAN - Quality Japanese Used Cars",
    template: "%s | REAL MOTOR JAPAN"
  },
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

  // 3️⃣  Check for legacy "session" (guest if present, but do not delete here)

  // 5️⃣  Default to “guest” values
  let isValid = false
  let userEmail = null
  let notificationCount = null

  // 6️⃣  If session_v2 exists, verify it via /api/verify-session





  // 7️⃣  Render the <html>… layout:
  //     • If hasOldSession but no valid session_v2 → we still treat as guest (no deletion here).
  //     • If session_v2 is invalid or missing → guest UI.
  //     • If session_v2 is valid → authenticated UI.
  return (
    <html lang="en">
      <head>
        {/* 1) GTM head script */}

    


      </head>



      <body className={`${geistSans.variable} ${geistMono.variable}`}>


        <SafeCssScanner />
        <ClientAppCheckWrapper />
        <IpInfoProvider>
          <ZambiaChecker />
          <PayPalBanner />
          {/* 
            Wrap everything in AuthProviderServer. 
            • If isValid===false (or there was that old session), we pass decodedToken={null}. 
            • If isValid===true, we pass decodedToken={userEmail}. 
          */}
          <AuthProviderServer>
            <Providers>
              <CurrencyProvider currency={currency}>
                <ClientLayoutWrapper
                  counts={null}
                  userEmail={null}
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
          src="https://samplermj.firebaseapp.com/__/auth/iframe.js"
          strategy="lazyOnload"
        />
        <GoogleTagManager gtmId="GTM-NJLD22H" />
        <ClarityScript />
      </body>
    </html>
  )
}