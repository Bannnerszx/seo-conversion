// src/middleware.js
import { NextResponse } from 'next/server'
import { decodeJwt } from 'jose' // 1. Import jose

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
    '/stock/:path*',
    '/payment-cart',
    '/orders/:path*',     // Ensure these match your protectedPrefixes
    '/favorites/:path*',
    '/profile/:path*',
  ],
}

export async function middleware(request) {
  const { nextUrl: url, cookies } = request
  const { origin, pathname } = url
  
  // 1. Setup Cookie Names
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ""
  const OLD_NAMES = OLD_NAMES_ENV.split(",").map((s) => s.trim()).filter(Boolean)
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  // 2. Legacy Cleanup (Keep this, it's fast)
  for (const name of OLD_NAMES) {
    const val = cookies.get(name)?.value
    if (val) {
      const resp = NextResponse.next()
      resp.cookies.delete(name, { path: '/' })
      return resp
    }
  }

  // 3. Check for Session Cookie
  const sessionCookie = cookies.get(COOKIE_NAME)?.value
  let isAuthenticated = false

  if (sessionCookie) {
    try {
      // ⚡️ PERFORMANCE FIX: 
      // Instead of calling API, just decode locally to check expiration.
      // We trust the Server Components to do the secure signature check later.
      const claims = decodeJwt(sessionCookie)
      const now = Math.floor(Date.now() / 1000)
      
      // Check if token is expired
      if (claims.exp && claims.exp > now) {
        isAuthenticated = true
      }
    } catch (e) {
      // If decoding fails, assume invalid
      isAuthenticated = false
    }
  }

  // 4. Handle Protected Routes
  const protectedPrefixes = ['/orders', '/favorites', '/profile', '/chats']
  const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (isProtected) {
    if (!isAuthenticated) {
      // If not logged in, bounce to login
      return NextResponse.redirect(new URL('/login', origin))
    }
  }

  // 5. Handle Guest Routes (Login/Signup)
  if (pathname === '/login' || pathname === '/signup') {
    if (isAuthenticated) {
      // If already logged in, bounce to home
      return NextResponse.redirect(new URL('/', origin))
    }
  }

  // 6. Stock Filters Persistence (Keep existing logic)
  if (pathname.startsWith('/stock')) {
    const hasCountry = url.searchParams.has('country')
    const hasPort = url.searchParams.has('port')
    const hasInspection = url.searchParams.has('inspection')
    const hasInsurance = url.searchParams.has('insurance')
    const hasClearing = url.searchParams.has('clearing')
    const hasDelivery = url.searchParams.has('delivery')

    const cookieCountry = cookies.get('stock_country')?.value
    const cookiePort = cookies.get('stock_port')?.value
    const cookieInspection = cookies.get('stock_inspection')?.value 
    const cookieInsurance = cookies.get('stock_insurance')?.value 
    const cookieClearing = cookies.get('stock_clearing')?.value
    const cookieDelivery = cookies.get('stock_delivery')?.value

    let mutated = false

    if (!hasCountry && cookieCountry) { url.searchParams.set('country', cookieCountry); mutated = true; }
    if (!hasPort && cookiePort) { url.searchParams.set('port', cookiePort); mutated = true; }
    if (!hasInspection && cookieInspection === '1') { url.searchParams.set('inspection', '1'); mutated = true; }
    if (!hasInsurance && cookieInsurance === '1') { url.searchParams.set('insurance', '1'); mutated = true; }
    if (!hasClearing && cookieClearing === '1') { url.searchParams.set('clearing', '1'); mutated = true; }
    if (!hasDelivery && cookieDelivery) { url.searchParams.set('delivery', cookieDelivery); mutated = true; }

    if (mutated) {
      return NextResponse.redirect(url)
    }
  }

  // 7. URL Rewrites (Keep existing)
  {
    const mOrdered = pathname.match(/^\/chats\/ordered\/([^\/\?#]+)/)
    if (mOrdered) return NextResponse.rewrite(new URL(`/chats/${mOrdered[1]}`, url))

    const mPayment = pathname.match(/^\/chats\/payment\/([^\/\?#]+)/)
    if (mPayment) return NextResponse.rewrite(new URL(`/chats/${mPayment[1]}`, url))
  }

  // 8. Legacy Redirects (Keep existing)
  if (pathname.startsWith('/ProductScreen/')) {
    const [, , id] = pathname.split('/')
    return NextResponse.redirect(new URL(`/product/${id}`, origin))
  }
  if (pathname.startsWith('/ProfileFormChatGroup')) return NextResponse.redirect(new URL('/chats', origin))
  if (pathname.startsWith('/HowToBuy')) return NextResponse.redirect(new URL('/howtobuy', origin))
  if (pathname === '/auth/login') return NextResponse.redirect(new URL('/login', origin))
  if (pathname.startsWith('/AboutUs')) return NextResponse.redirect(new URL('/about', origin))
  if (pathname.startsWith('/LocalIntroduction')) return NextResponse.redirect(new URL('/localintroduction', origin))
  if (pathname === '/LocalInformation' && url.searchParams.has('country')) {
    const country = url.searchParams.get('country')
    return NextResponse.redirect(new URL(`/localinformation/${country}`, origin))
  }
  if (pathname.startsWith('/car_list/All/') && pathname.endsWith('/All')) {
    const [, , , make] = pathname.split('/')
    return NextResponse.redirect(new URL(`/stock/${make}`, origin))
  }
  if (pathname === '/car_list/car') return NextResponse.redirect(new URL('/stock', origin))
  if (pathname === '/SearchCarDesign') {
    const make = url.searchParams.get('make')
    const model = url.searchParams.get('model')
    const carMakes = url.searchParams.get('carMakes')
    const carModels = url.searchParams.get('carModels')
    let dest = '/stock'
    if (make && model) dest = `/stock/${encodeURIComponent(make)}/${encodeURIComponent(model)}`
    else if (carMakes && carModels) dest = `/stock/${encodeURIComponent(carMakes)}/${encodeURIComponent(carModels)}`
    else if (make) dest = `/stock/${encodeURIComponent(make)}`
    return NextResponse.redirect(new URL(dest, origin))
  }
  if (pathname === '/stock_detail') return NextResponse.redirect(new URL('/stock', origin))

  return NextResponse.next()
}