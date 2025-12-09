'use server'
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { checkUserExist, getAccountData } from "../actions/actions"
import { fetchCarMakes, fetchCountries } from "../../../services/fetchFirebaseData"
import ClientAppCheck from "../../../firebase/ClientAppCheck"
import RequestForm from "./requestFormComponents/RequestForm"
export async function generateMetaData() {
    return {
        title: 'Request Form',
        descriptio: "Vehicle request form."
    }
}

export default async function RequestFormServer() {
    const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES
    const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

    const oldNames = OLD_NAMES_ENV
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)

    const cookieStore = await cookies();

    for (const legacyName of oldNames) {
        if (cookieStore.get(legacyName)?.value) {
      redirect(`/login?redirect=${encodeURIComponent("/request-form")}`)
        }
    }
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value

    if (!sessionCookie) {
 redirect(`/login?redirect=${encodeURIComponent("/request-form")}`)
    }

    let userEmail = null

    try {
        const origin = process.env.NEXT_PUBLIC_APP_URL || "https://www.realmotor.jp"
        const verifyRes = await fetch(`${origin}/api/verify-session`, {
            method: 'GET',
            headers: {
                cookie: `${COOKIE_NAME}=${sessionCookie}`
            },
            cache: 'no-store'
        })
        const apiJson = await verifyRes.json()

        if (!apiJson.valid) {
           redirect(`/login?redirect=${encodeURIComponent("/request-form")}`)
        }

        userEmail = apiJson.claims.email || null
    } catch (error) {
        console.error("[Request form] /api/verify-session error:", error)
  redirect(`/login?redirect=${encodeURIComponent("/request-form")}`)
    }

    const { exists, missingFields } = await checkUserExist(userEmail)
    if (!exists || (missingFields && missingFields.length > 0)) {
    redirect(`/accountCreation?redirect=${encodeURIComponent("/request-form")}`)
    }
    const countryArray = (await fetchCountries()) || [];

    const carMakesList = await fetchCarMakes();

    const accountData = await getAccountData(userEmail) || [];
    return (
        <>
            <ClientAppCheck />
            <RequestForm countryArray={countryArray} carMakes={carMakesList} accountData={accountData} />
        </>
    )

}