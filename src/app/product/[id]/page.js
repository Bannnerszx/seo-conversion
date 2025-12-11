
import { SortProvider } from '@/app/stock/stockComponents/sortContext';
import { fetchCarDataAdmin, fetchCountries, fetchCurrency, fetchInspectionToggle } from '../../../../services/fetchFirebaseData';
import CarProductPageCSR from '../productComponents/CarProductPageCSR';
import VehicleSpecifications from '../productComponents/VehicleSpecificationsCSR';
import { useAuth } from '@/app/providers/AuthProvider';
import { makeFavorite, isFavorited, getAccountData, fetchChatCountForVehicle, fetchD2DCountries } from '@/app/actions/actions';
import { Toaster } from 'sonner';
import { cookies } from "next/headers";
import ClientAppCheck from '../../../../firebase/ClientAppCheck';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { id } = await params
  const baseUrl = "https://www.realmotor.jp"

  const canonicalUrl = `${baseUrl}/product/${id}`;

  const product = await fetchCarDataAdmin(id)

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you're looking for doesn't exist.",
      robots: {
        index: false,
        follow: false
      }
    }
  }

  return {
    title: `Used ${product.carName} for Sale`,
    description: product.carDescription || "Product description",
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: product.carName,
      description: product.carDescription,
      images: [
        {
          url: product.thumbnailImage || '/placeholder.jpg',
          width: 800,
          height: 600,
          alt: product.carName
        }
      ]
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

  // call the loader, it will never throw
  const product = await fetchCarDataAdmin(id)
  let chatCount = 0; // 1. Default to 0

  try {
    // 2. Try to get the real count
    const count = await fetchChatCountForVehicle(id);

    // 3. Make sure the result is a valid number
    if (typeof count === 'number' && !isNaN(count)) {
      chatCount = count;
    }
  } catch (error) {
    // 4. If any part of the 'try' fails, chatCount just stays 0
    console.error("Failed to fetch chat count, defaulting to 0:", error);
  }


  if (!product) {
    notFound(); // renders the 404 page
  }

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


  const D2DCountries = await fetchD2DCountries()

  const yenPrice = carData?.fobPriceNumber || 0;
  const exchangeRate = currency?.jpyToUsd || 0; // Fallback rate if fetch fails
  const priceInUSD = Math.round(yenPrice * exchangeRate);
  //product schema

  const today = new Date();

  // Future date (for active listings) - e.g., 30 days from now
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30);

  // Past date (for sold/reserved listings) - e.g., yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // 2. Determine status based on your data
  const isAvailable = carData.stockStatus === "On-Sale";

  // 3. Set the Schema string based on status
  // If available -> Future Date. If sold/reserved -> Yesterday.
  const validUntilString = isAvailable
    ? futureDate.toISOString().split('T')[0]
    : yesterday.toISOString().split('T')[0];
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Vehicle",
    "name": carData.carName,
    "image": carData.thumbnailImage ? carData.thumbnailImage : `https://www.realmotor.jp${carData.thumbnailImage}`,

    // FIX 1: Fallback description
    "description": carData.carDescription || `Used ${carData.year} ${carData.make} ${carData.model} for sale. VIN: ${carData.chassisNumber}.`,
 
    "brand": {
      "@type": "Brand",
      "name": carData.make
    },
    "model": carData.model,
    "vehicleModelDate": carData.year, // Note: Schema usually prefers YYYY-MM-DD or YYYY format
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": carData.mileage,
      "unitCode": "KMT"
    },
    "vehicleIdentificationNumber": carData.chassisNumber,
    "offers": {
      "@type": "Offer",
      "url": `https://www.realmotor.jp/product/${id}`,
      "priceCurrency": "USD",
      "price": priceInUSD,
      "priceValidUntil": validUntilString,
      "itemCondition": "https://schema.org/UsedCondition",
      "availability": isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      "seller": {
        "@type": "AutoDealer",
        "name": "REAL MOTOR JAPAN"
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 0,
        "returnMethod": "https://schema.org/ReturnNotPermitted"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 0,
          "currency": "USD"
        },
        "doesNotShip": false
      }
    }
  }


  // 4️⃣ If any legacy cookie still exists, render guest UI immediately
  for (const legacyName of oldNames) {
    if (cookieStore.get(legacyName)?.value) {
      return (
        <SortProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
          <Toaster
            position="top-right"
            offset={16}
            mobileOffset={10}
            richColors
            closeButton
          />
          <div className="z-10 mt-2">
            <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
              <CarProductPageCSR
                resultsIsFavorited={""} // guest sees no favorites
                currency={currency}
                carData={carData}
                countryArray={countryArray}
                useAuth={useAuth}
                chatCount={chatCount}
                d2dCountries={D2DCountries}
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <Toaster
          position="top-right"
          offset={16}
          mobileOffset={10}
          richColors
          closeButton
        />
        <div className="z-10 mt-2">
          <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
            <CarProductPageCSR
              resultsIsFavorited={""}
              currency={currency}
              carData={carData}
              countryArray={countryArray}
              useAuth={useAuth}
              chatCount={chatCount}
              d2dCountries={D2DCountries}
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
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://www.realmotor.jp"
    const verifyRes = await fetch(`${origin}/api/verify-session`, {
      method: "GET",
      headers: {
        cookie: `${COOKIE_NAME}=${sessionCookie}`,
      },
      next: { revalidate: 60 }
    })
    const apiJson = await verifyRes.json()

    if (apiJson.valid) {
      userEmail = apiJson.claims.email || null
      resultsIsFavorited = await isFavorited({ userEmail })
    } else {
      // If invalid, render guest UI
      return (
        <SortProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
          <Toaster
            position="top-right"
            offset={16}
            mobileOffset={10}
            richColors
            closeButton
          />
          <div className="z-10 mt-2">
            <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
              <CarProductPageCSR
                resultsIsFavorited={""}
                currency={currency}
                carData={carData}
                countryArray={countryArray}
                useAuth={useAuth}
                chatCount={chatCount}
                d2dCountries={D2DCountries}
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <Toaster
          position="top-right"
          offset={16}
          mobileOffset={10}
          richColors
          closeButton
        />
        <div className="z-10 mt-2">
          <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
            <CarProductPageCSR
              resultsIsFavorited={""}
              currency={currency}
              carData={carData}
              countryArray={countryArray}
              useAuth={useAuth}
              chatCount={chatCount}
              d2dCountries={D2DCountries}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Toaster
        position="top-right"
        offset={16}
        mobileOffset={10}
        richColors
        closeButton
      />
      <ClientAppCheck />
      <div className="z-10 mt-2">
        <div style={{ zoom: 0.8, transformOrigin: "top left" }} className='-mt-12'>
          <CarProductPageCSR
            chatCount={chatCount}
            accountData={accountData}
            resultsIsFavorited={resultsIsFavorited}
            currency={currency}
            carData={carData}
            countryArray={countryArray}
            useAuth={useAuth}
            userEmail={userEmail}
            d2dCountries={D2DCountries}
          />

          <div className='-mt-12'>
            <VehicleSpecifications carData={carData} />
          </div>
        </div>
      </div>
    </SortProvider>
  )
}