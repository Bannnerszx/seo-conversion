
import { SortProvider } from '@/app/stock/stockComponents/sortContext';
import { fetchCarDataAdmin, fetchCountries, fetchCurrency, fetchInspectionToggle } from '../../../../services/fetchFirebaseData';
import CarProductPageCSR from '../productComponents/CarProductPageCSR';
import VehicleSpecifications from '../productComponents/VehicleSpecificationsCSR';
import { useAuth } from '@/app/providers/AuthProvider';
import { makeFavorite, isFavorited, getAccountData } from '@/app/actions/actions';
import { admin } from '@/lib/firebaseAdmin';
import { cookies } from "next/headers";
import ClientAppCheck from '../../../../firebase/ClientAppCheck';
import { notFound } from 'next/navigation';
export async function generateMetadata({ params }) {
  // no await needed here:
  const { id } = await params

  // call the loader, it will never throw
  const product = await fetchCarDataAdmin(id)

  // 1) if missing, either return fallback *or* 404
  if (product === false) {
    // → OPTION A: return safe fallback metadata
    // return {
    //     title: "Product Not Found | My Product Site",
    //     description: "The product you are looking for does not exist.",
    // }

    // → OPTION B: turn into a hard 404 page
    notFound()
  }

  // 2) otherwise, return the real metadata
  return {
    title: `Used ${product.carName} for Sale - REAL MOTOR JAPAN`,
    description: product.carDescription || "Product description",
    openGraph: {
      title: product.carName,
      description: product.carDescription,
      images: [
        {
          url: product.imageUrl || "/defaultImage.png",
          width: 800,
          height: 600,
          alt: product.carName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.carName} - My Product Site`,
      description: product.carDescription,
      images: [product.imageUrl || "/defaultImage.png"],
    },
  }
}



export default async function ProductPage({ params, searchParams }) {
  const { id } = await params
  const sp = await searchParams || {}
  const country = sp.country || ""
  const port = sp.port || ""
  const countryArray = (await fetchCountries()) || []
  const carData = await fetchCarDataAdmin(id)
  const currency = (await fetchCurrency()) || []
  if (carData === false) {
    notFound()
  }

  // 1️⃣ Read comma-separated list of all legacy cookie names and the current cookie name
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  // 2️⃣ Convert OLD_NAMES_ENV into an array
  const oldNames = OLD_NAMES_ENV
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)

  // 3️⃣ Read cookies() synchronously
  const cookieStore = await cookies()

  // 4️⃣ If any legacy cookie still exists, render guest UI immediately
  for (const legacyName of oldNames) {
    if (cookieStore.get(legacyName)?.value) {
      return (
        <SortProvider>
          <div className="z-10 mt-2">
            <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
              <CarProductPageCSR
                resultsIsFavorited={""} // guest sees no favorites
                currency={currency}
                carData={carData}
                countryArray={countryArray}
                useAuth={useAuth}
              />
            </div>
            <div className='-mt-12'>
              <VehicleSpecifications carData={carData} />
            </div>
          </div>
        </SortProvider>
      )
    }
  }

  // 5️⃣ Read only the current cookie
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value

  // 6️⃣ If there’s no current cookie, render guest UI immediately
  if (!sessionCookie) {
    return (
      <SortProvider>
        <div className="z-10 mt-2">
          <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
            <CarProductPageCSR
              resultsIsFavorited={""}
              currency={currency}
              carData={carData}
              countryArray={countryArray}
              useAuth={useAuth}
            />
            <div className='-mt-12'>
              <VehicleSpecifications carData={carData} />
            </div>
          </div>

        </div>
      </SortProvider>
    )
  }

  // 7️⃣ COOKIE_NAME exists, so call /api/verify-session
  let userEmail = null
  let resultsIsFavorited = []

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verifyRes = await fetch(`${origin}/api/verify-session`, {
      method: "GET",
      headers: {
        cookie: `${COOKIE_NAME}=${sessionCookie}`,
      },
      cache: "no-store",
    })
    const apiJson = await verifyRes.json()

    if (apiJson.valid) {
      userEmail = apiJson.claims.email || null
      resultsIsFavorited = await isFavorited({ userEmail })
    } else {
      // If invalid, render guest UI
      return (
        <SortProvider>
          <div className="z-10 mt-2">
            <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
              <CarProductPageCSR
                resultsIsFavorited={""}
                currency={currency}
                carData={carData}
                countryArray={countryArray}
                useAuth={useAuth}
              />


              <div className='-mt-12'>
                <VehicleSpecifications carData={carData} />
              </div>
            </div>
          </div>
        </SortProvider>
      )
    }
  } catch (err) {
    console.error("[ProductPage] /api/verify-session error:", err)
    // On any error, render guest UI
    return (
      <SortProvider>
        <div className="z-10 mt-2">
          <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
            <CarProductPageCSR
              resultsIsFavorited={""}
              currency={currency}
              carData={carData}
              countryArray={countryArray}
              useAuth={useAuth}
            />

            <div className='-mt-12'>
              <VehicleSpecifications carData={carData} />
            </div>
          </div>
        </div>
      </SortProvider>
    )
  }

  // 8️⃣ Now that COOKIE_NAME is valid and we have userEmail, fetch account data
  const accountData = await getAccountData(userEmail)

  // 9️⃣ Render authenticated UI
  return (
    <SortProvider>
      <ClientAppCheck />
      <div className="z-10 mt-2">
        <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
          <CarProductPageCSR
            accountData={accountData}
            resultsIsFavorited={resultsIsFavorited}
            currency={currency}
            carData={carData}
            countryArray={countryArray}
            useAuth={useAuth}
            userEmail={userEmail}
          />

          <div className='-mt-12'>
            <VehicleSpecifications carData={carData} />
          </div>
        </div>
      </div>
    </SortProvider>
  )
}