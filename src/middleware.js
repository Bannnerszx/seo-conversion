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
    // ensure middleware runs on /stock and all subroutes
    '/stock/:path*',
    // payment-cart needs middleware to guard empty carts
    '/payment-cart',
  ],
}

export async function middleware(request) {
  const { nextUrl: url, cookies } = request
  const { origin, pathname } = url
  const ORINAL_URL = process.env.NEXT_PUBLIC_APP_URL || origin
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ""
  const OLD_NAMES = OLD_NAMES_ENV.split(",").map((s) => s.trim()).filter(Boolean)

  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  // 0) Drop any old session cookie names (legacy cleanup)
  for (const name of OLD_NAMES) {
    const val = cookies.get(name)?.value
    if (val) {
      const resp = NextResponse.next()
      resp.cookies.delete(name, { path: '/' })
      return resp
    }
  }

  // 1) Protected prefixes require a verified session
  const protectedPrefixes = [
    '/orders',
    '/favorites',
    '/profile',
    '/chats',
  ]
  const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (isProtected) {
    const sessionCookie = cookies.get(COOKIE_NAME)?.value ?? null

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', ORINAL_URL))
    }

    let apiJson = { valid: false }
    try {
      const verifyRes = await fetch(`${ORINAL_URL}/api/verify-session`, {
        method: 'GET',
        headers: {
          cookie: `${COOKIE_NAME}=${sessionCookie}`,
        },
        cache: 'no-store',
      })
      apiJson = await verifyRes.json()
    } catch (e) {
      apiJson = { valid: false }
    }

    if (!apiJson.valid) {
      return NextResponse.redirect(new URL('/login', ORINAL_URL))
    }
  }

  // 2) Redirect away from /login & /signup if already authenticated
  {
    const sessionCookie = cookies.get(COOKIE_NAME)?.value ?? null
    if (sessionCookie) {
      try {
        const verifyRes = await fetch(`${ORINAL_URL}/api/verify-session`, {
          method: 'GET',
          headers: { cookie: `${COOKIE_NAME}=${sessionCookie}` },
          cache: 'no-store',
        })
        const apiJson = await verifyRes.json()
        if (apiJson.valid && (pathname === '/login' || pathname === '/signup')) {
          return NextResponse.redirect(new URL('/', ORINAL_URL))
        }
      } catch (e) {
        // ignore and continue
      }
    }
  }

  // 3) SSR-safe stock filters persistence for /stock/**
  if (pathname.startsWith('/stock')) {
    // Existing checks
    const hasCountry = url.searchParams.has('country')
    const hasPort = url.searchParams.has('port')
    const hasInspection = url.searchParams.has('inspection')
    const hasInsurance = url.searchParams.has('insurance')
    
    // NEW: Check for Clearing and Delivery params
    const hasClearing = url.searchParams.has('clearing')
    const hasDelivery = url.searchParams.has('delivery')

    // Existing cookies
    const cookieCountry = cookies.get('stock_country')?.value
    const cookiePort = cookies.get('stock_port')?.value
    const cookieInspection = cookies.get('stock_inspection')?.value 
    const cookieInsurance = cookies.get('stock_insurance')?.value 
    
    // NEW: Get Clearing and Delivery cookies
    const cookieClearing = cookies.get('stock_clearing')?.value // "1" or "0"
    const cookieDelivery = cookies.get('stock_delivery')?.value // "CityName"

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
    if (!hasInsurance && cookieInsurance === '1') {
      url.searchParams.set('insurance', '1')
      mutated = true
    }

    // NEW: Apply persistence for Clearing
    if (!hasClearing && cookieClearing === '1') {
      url.searchParams.set('clearing', '1')
      mutated = true
    }

    // NEW: Apply persistence for Delivery (City Name)
    if (!hasDelivery && cookieDelivery) {
      url.searchParams.set('delivery', cookieDelivery)
      mutated = true
    }

    if (mutated) {
      return NextResponse.redirect(url)
    }
  }

  // 4) Conversion URL rewrites for chats (keep visible URL but render chat)
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

  // 5) Other non-chat redirects
  if (pathname.startsWith('/ProductScreen/')) {
    const [, , id] = pathname.split('/')
    return NextResponse.redirect(new URL(`/product/${id}`, origin))
  }
  if (pathname.startsWith('/ProfileFormChatGroup')) {
    return NextResponse.redirect(new URL('/chats', origin))
  }
  if (pathname.startsWith('/HowToBuy')) {
    return NextResponse.redirect(new URL('/howtobuy', origin))
  }
  if (pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/login', origin))
  }
  if (pathname.startsWith('/AboutUs')) {
    return NextResponse.redirect(new URL('/about', origin))
  }
  if (pathname.startsWith('/LocalIntroduction')) {
    return NextResponse.redirect(new URL('/localintroduction', origin))
  }
  if (pathname === '/LocalInformation' && url.searchParams.has('country')) {
    const country = url.searchParams.get('country')
    return NextResponse.redirect(new URL(`/localinformation/${country}`, origin))
  }
  if (pathname.startsWith('/car_list/All/') && pathname.endsWith('/All')) {
    const [, , , make] = pathname.split('/')
    return NextResponse.redirect(new URL(`/stock/${make}`, origin))
  }
  if (pathname === '/car_list/car') {
    return NextResponse.redirect(new URL('/stock', origin))
  }
  if (pathname === '/SearchCarDesign') {
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
    return NextResponse.redirect(new URL(dest, origin))
  }
  if (pathname === '/stock_detail') {
    return NextResponse.redirect(new URL('/stock', origin))
  }

  // Allow the request to continue
  return NextResponse.next()
}