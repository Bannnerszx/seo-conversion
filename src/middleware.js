// middleware.js
import { NextResponse } from 'next/server'

// The config matcher remains the same
export const config = {
  matcher: [
    '/login',
    '/signup',
    '/ProductScreen/:path*',
    '/ProfileFormChatGroup/:path*',
    '/HowToBuy/:path*',
    '/auth/login',
    '/AboutUs/:path*',
    '/LocalIntroduction/:path*',
    '/LocalInformation',
    '/car_list/:path*',
    '/SearchCarDesign',
    '/chats/:path*',
    '/stock_detail',
  ],
}

export async function middleware(request) {
  const { nextUrl: url, cookies } = request
  const { origin, pathname } = url
  const ORINAL_URL = process.env.NEXT_PUBLIC_APP_URL
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  // ===================================================================
  // Steps 0-3: Authentication Logic (No changes needed here)
  // ===================================================================

  // 0️⃣ Drop old cookies (if any)
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ''
  const OLD_NAMES = OLD_NAMES_ENV.split(',').map((s) => s.trim()).filter(Boolean)
  const oldValue = cookies.get(OLD_NAMES)?.value
  if (oldValue) {
    const resp = NextResponse.next()
    resp.cookies.delete(OLD_NAMES, { path: '/' })
    return resp
  }

  // 1️⃣ Determine if path is protected
  const protectedPrefixes = ['/orders', '/favorites', '/profile', '/chats']
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )

  // 2️⃣ Verify session for protected paths
  if (isProtected) {
    const sessionCookie = cookies.get(COOKIE_NAME)?.value ?? null
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', ORINAL_URL))
    }
    try {
      const verifyRes = await fetch(`${ORINAL_URL}/api/verify-session`, {
        headers: { cookie: `${COOKIE_NAME}=${sessionCookie}` },
        cache: 'no-store',
      })
      const apiJson = await verifyRes.json()
      if (!apiJson.valid) {
        return NextResponse.redirect(new URL('/login', ORINAL_URL))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', ORINAL_URL))
    }
  }

  // 3️⃣ Redirect away from /login & /signup if authenticated
  const sessionCookie = cookies.get(COOKIE_NAME)?.value ?? null
  if (sessionCookie && (pathname === '/login' || pathname === '/signup')) {
    try {
      const verifyRes = await fetch(`${ORINAL_URL}/api/verify-session`, {
        headers: { cookie: `${COOKIE_NAME}=${sessionCookie}` },
        cache: 'no-store',
      })
      const apiJson = await verifyRes.json()
      if (apiJson.valid) {
        return NextResponse.redirect(new URL('/', ORINAL_URL))
      }
    } catch {
      // If verify fails, do nothing and let them stay on the login page
    }
  }

  // ===================================================================
  // Step 4: Unified Redirect & Rewrite Logic
  // ===================================================================
  const segments = pathname.split('/').filter(Boolean)

  // --- Chat Logic ---
  if (segments[0] === 'chats') {
    // A) If it's a "bare" chat URL like /chats/chat_123, check the tracker
    if (segments.length === 2) {
      const chatId = segments[1]
      try {
        const trackerRes = await fetch(
          `${ORINAL_URL}/api/getChatTracker?chatId=${encodeURIComponent(chatId)}`,
          { headers: { cookie: request.headers.get('cookie') ?? '' } } // Forward cookies
        )
        if (trackerRes.ok) {
          const { tracker } = await trackerRes.json()
          if (tracker === 3) {
            return NextResponse.redirect(
              new URL(`/chats/ordered/${chatId}`, ORINAL_URL)
            )
          }
          if (tracker >= 4) {
            return NextResponse.redirect(
              new URL(`/chats/payment/${chatId}`, ORINAL_URL)
            )
          }
        }
      } catch (e) {
        console.error('Failed to fetch chat tracker:', e)
      }
      // If tracker doesn't require a redirect, rewrite to show the main chat component
      return NextResponse.rewrite(new URL('/chats', ORINAL_URL))
    }

    // B) If it's already /ordered or /payment, rewrite to show the main chat component
    if (
      segments.length === 3 &&
      (segments[1] === 'ordered' || segments[1] === 'payment')
    ) {
      return NextResponse.rewrite(new URL('/chats', ORINAL_URL))
    }

    // C) For any other /chats/* URL, just let it pass (or redirect to /chats)
    return NextResponse.next()
  }

  // --- Other Legacy Redirects ---
  let response

  if (pathname.startsWith('/ProductScreen/')) {

    const [, , id] = pathname.split('/')

    response = NextResponse.redirect(new URL(`/product/${id}`, origin))

  } else if (pathname.startsWith('/ProfileFormChatGroup')) {

    response = NextResponse.redirect(new URL('/chats', origin))

  } else if (pathname.startsWith('/HowToBuy')) {

    response = NextResponse.redirect(new URL('/howtobuy', origin))

  } else if (pathname === '/auth/login') {

    response = NextResponse.redirect(new URL('/login', origin))

  } else if (pathname.startsWith('/AboutUs')) {

    response = NextResponse.redirect(new URL('/about', origin))

  } else if (pathname.startsWith('/LocalIntroduction')) {

    response = NextResponse.redirect(new URL('/localintroduction', origin))

  } else if (

    pathname === '/LocalInformation' &&

    url.searchParams.has('country')

  ) {

    const country = url.searchParams.get('country')

    response = NextResponse.redirect(

      new URL(`/localinformation/${country}`, origin)

    )

  } else if (

    pathname.startsWith('/car_list/All/') &&

    pathname.endsWith('/All')

  ) {

    const [, , , make] = pathname.split('/')

    response = NextResponse.redirect(new URL(`/stock/${make}`, origin))

  } else if (pathname === '/car_list/car') {

    response = NextResponse.redirect(new URL('/stock', origin))

  } else if (pathname === '/SearchCarDesign') {

    const make = url.searchParams.get('make')

    const model = url.searchParams.get('model')

    const carMakes = url.searchParams.get('carMakes')

    const carModels = url.searchParams.get('carModels')


    let dest

    if (make && model) {

      dest = `/stock/${encodeURIComponent(make)}/${encodeURIComponent(model)}`

    } else if (carMakes && carModels) {

      dest = `/stock/${encodeURIComponent(carMakes)}/${encodeURIComponent(carModels)}`

    } else if (make) {

      dest = `/stock/${encodeURIComponent(make)}`

    } else {

      dest = '/stock'

    }

    response = NextResponse.redirect(new URL(dest, origin))

  } else if (pathname === '/stock_detail') {

    // catch anything under /stock_detail?id=…&target_site=…

    response = NextResponse.redirect(new URL('/stock', origin))

  } else {

    response = NextResponse.next()

  }





  // Add the rest of your redirects here...

  // Final fallback: If no other rules match, continue to the requested page
  return NextResponse.next()
}