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
    // …add any other protected top‐level folders here…
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
  // 0️⃣  Drop any old "session" cookie immediately
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
    // …any other top‐level routes you consider protected…
  ]
  const isProtected = protectedPrefixes.some(prefix =>
    pathname.startsWith(prefix)
  )

  // ───────────────────────────────────────────────────────
  // 2️⃣  If protected, verify the new "session_v2" cookie
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

    // 2d) Otherwise (valid === true), let the protected page render
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
    // If invalid, /api/verify-session already deleted session_v2 for us.
  }

  if (isVerified && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', ORINAL_URL))
  }

  // ───────────────────────────────────────────────────────
  // 4️⃣  Tracker‐based chat redirects (unchanged)
  // ───────────────────────────────────────────────────────
  if (
    pathname.startsWith('/chats/payment/') ||
    pathname.startsWith('/chats/ordered/')
  ) {
    return NextResponse.next()
  }

  // ── 2) only handle the “bare” chat URL: /chats/<chatId>
  //     segments = ["chats", "<chatId>"]
  const segments = pathname.split('/').filter(Boolean)
  if (!(segments[0] === 'chats' && segments.length === 2)) {
    return NextResponse.next()
  }
  const chatId = segments[1]

  // ── 3) fetch tracker and redirect if needed
  try {
    const trackerRes = await fetch(
      `${ORINAL_URL}/api/getChatTracker?chatId=${encodeURIComponent(chatId)}`,
      { next: { revalidate: 5 } }
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

  // ───────────────────────────────────────────────────────
  // 5️⃣  Other non-chat redirects (unchanged)
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
  // 6️⃣  Rewrite “deep” chats → /chats (but skip ordered/payment)
  // ───────────────────────────────────────────────────────
  const parts = pathname.split('/')
  const isDeepChat = parts[1] === 'chats' && parts.length > 2
  const isSpecial = parts[2] === 'ordered' || parts[2] === 'payment'

  if (isDeepChat && !isSpecial) {
    return NextResponse.rewrite(new URL('/chats', ORINAL_URL))
  }

  return response
}
