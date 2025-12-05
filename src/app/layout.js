// app/layout.js

import { GoogleTagManager } from "@next/third-parties/google"
import { Geist, Geist_Mono } from "next/font/google"
import { fetchCurrency } from "../../services/fetchFirebaseData"
import "./globals.css"
import { CurrencyProvider } from "@/providers/CurrencyContext"
import ClientLayoutWrapper from "./ClientLayoutWrapper"
import AuthProviderServer from "./providers/AuthProviderServer"
import Providers from "./ProgressProvider"
import { cookies } from "next/headers"
import { getBannerConfig } from "@/lib/bannerService"
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


async function checkBannerVisibility() {
  // A. Check Global Switch (Firestore)
  const isGlobalBannerOn = await getBannerConfig();
  if (!isGlobalBannerOn) return false;

  // B. Check User Cookie
  const cookieStore = await cookies();
  const lastShown = cookieStore.get('banner_last_shown')?.value;
  const now = Date.now();

  const ageDays = lastShown
    ? (now - Number(lastShown)) / (1000 * 60 * 60 * 24)
    : Infinity;

  // C. Show if never seen OR seen > 2 days ago
  if (!lastShown || ageDays >= 2) {
    return true;
  }

  return false;
}

export default async function RootLayout({ children }) {


  // 1️⃣  Always fetch currency
  const [currency, showBanner] = await Promise.all([
    fetchCurrency(),
    checkBannerVisibility() // 👈 Server determines TRUE/FALSE immediately
  ]);
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
                  initialShowBanner={showBanner}
                >
                  <BannerProvider>

                    {children}

                  </BannerProvider>
                </ClientLayoutWrapper>
              </CurrencyProvider>
            </Providers>
          </AuthProviderServer>
        </IpInfoProvider>
        <GoogleTagManager gtmId="GTM-NJLD22H" />
        <ClarityScript />
      </body>
    </html>
  )
}