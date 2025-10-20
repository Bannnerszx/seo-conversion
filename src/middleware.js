// middleware.js
import { NextResponse } from 'next/server'

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
    // ✅ ensure middleware runs on /stock and all subroutes
    '/stock/:path*',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|otf)$).*)',
  ],
}

export async function middleware(request) {
  const { nextUrl: url, cookies } = request
  const { origin, pathname } = url
  const ORINAL_URL = process.env.NEXT_PUBLIC_APP_URL
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ""
  const OLD_NAMES = OLD_NAMES_ENV.split(",").map((s) => s.trim()).filter(Boolean)

  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  // ──────────────
  // 0️⃣  Drop any old "session" cookie immediately (legacy clean-up)
  // ──────────────
  const oldValue = cookies.get(OLD_NAMES)?.value
  if (oldValue) {
    const resp = NextResponse.next()
    resp.cookies.delete(OLD_NAMES, { path: "/" })
    return resp
  }

  // ───────────────────────────────────────────────────────
  // 1️⃣  Determine if this path is “protected” (requires login)
  // ───────────────────────────────────────────────────────
  const protectedPrefixes = [
    '/orders',
    '/favorites',
    '/profile',
    '/chats',
  ]
  const isProtected = protectedPrefixes.some(prefix =>
    pathname.startsWith(prefix)
  )

  // ───────────────────────────────────────────────────────
  // 2️⃣  If protected, verify the "session_v2" cookie
  // ───────────────────────────────────────────────────────
  if (isProtected) {
    const sessionCookie = cookies.get(COOKIE_NAME)?.value ?? null

    // 2a) If there's no session_v2 at all, redirect immediately:
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', ORINAL_URL))
    }

    // 2b) If session_v2 exists, call /api/verify-session
    let apiJson = { valid: false }
    try {
      const verifyRes = await fetch(`${ORINAL_URL}/api/verify-session`, {
        method: 'GET',
        headers: {
          // Forward the raw session_v2 cookie so the API can read req.cookies.session_v2
          cookie: `${COOKIE_NAME}=${sessionCookie}`,
        },
        cache: 'no-store',
      })
      apiJson = await verifyRes.json()
    } catch {
      apiJson = { valid: false }
    }

    // 2c) If invalid, /api/verify-session has already deleted session_v2.
    //       Redirect to /login.
    if (!apiJson.valid) {
      return NextResponse.redirect(new URL('/login', ORINAL_URL))
    }
  }

  // ───────────────────────────────────────────────────────
  // 3️⃣  Redirect away from /login & /signup if already authenticated
  // ───────────────────────────────────────────────────────
  const sessionCookie = cookies.get(COOKIE_NAME)?.value ?? null
  let isVerified = false

  if (sessionCookie) {
    try {
      const verifyRes = await fetch(`${ORINAL_URL}/api/verify-session`, {
        method: 'GET',
        headers: {
          cookie: `${COOKIE_NAME}=${sessionCookie}`,
        },
        cache: 'no-store',
      })
      const apiJson = await verifyRes.json()
      if (apiJson.valid) {
        isVerified = true
      }
    } catch {
      isVerified = false
    }
  }

  if (isVerified && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', ORINAL_URL))
  }

  // ───────────────────────────────────────────────────────
  // 4️⃣  SSR-safe stock filters persistence for /stock/**
  //     If country/port are missing in the URL, inject from cookies and redirect once.
  // ───────────────────────────────────────────────────────
  if (pathname.startsWith('/stock')) {
    const hasCountry = url.searchParams.has('country')
    const hasPort = url.searchParams.has('port')
    const hasInspection = url.searchParams.has('inspection')

    const cookieCountry = cookies.get('stock_country')?.value
    const cookiePort = cookies.get('stock_port')?.value
    const cookieInspection = cookies.get('stock_inspection')?.value // "1" or "0"

    let mutated = false
    if (!hasCountry && cookieCountry) {
      url.searchParams.set('country', cookieCountry)
      mutated = true
    }
    if (!hasPort && cookiePort) {
      url.searchParams.set('port', cookiePort)
      mutated = true
    }
    if (!hasInspection && cookieInspection === '1') {
      url.searchParams.set('inspection', '1')
      mutated = true
    }

    if (mutated) {
      // Redirect to the same /stock/** path with injected filters
      return NextResponse.redirect(url)
    }
  }

  // ───────────────────────────────────────────────────────
  // 5️⃣  NEW: Conversion URL rewrites (no OLD_GUARD redirects)
  //     Keep the visible URL (/chats/ordered|payment/:chatId) so GTM can fire,
  //     but render /chats/:chatId under the hood.
  // ───────────────────────────────────────────────────────
  {
    const mOrdered = pathname.match(/^\/chats\/ordered\/([^\/\?#]+)/)
    if (mOrdered) {
      const chatId = mOrdered[1]
      const cloned = url.clone()
      cloned.pathname = `/chats/${chatId}`
      return NextResponse.rewrite(cloned)
    }

    const mPayment = pathname.match(/^\/chats\/payment\/([^\/\?#]+)/)
    if (mPayment) {
      const chatId = mPayment[1]
      const cloned = url.clone()
      cloned.pathname = `/chats/${chatId}`
      return NextResponse.rewrite(cloned)
    }
  }

  // ───────────────────────────────────────────────────────
  // 6️⃣  Other non-chat redirects (unchanged)
  // ───────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────
  // 7️⃣  (REMOVED) OLD_GUARD:
  //     - Tracker-based redirects from /chats/:chatId → /chats/ordered|payment/...
  //     - Rewrite “deep” chats → /chats
  // ───────────────────────────────────────────────────────

  return response
}
