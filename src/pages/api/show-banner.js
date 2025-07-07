// pages/api/show-banner.js
import { getCookie, setCookie } from 'cookies-next/server'
import { admin } from '@/lib/firebaseAdmin'
export default async function handler(req, res) {
  // 0) prevent any caching
  res.setHeader('Cache-Control', 'no-store')

  // 1) fetch your banner‐enabled flag from Firestore
  const docSnap = await admin
    .firestore()
    .collection('InfoBanner')
    .doc('config')
    .get()

  const showBannerConfig = docSnap.exists
    ? docSnap.data().showBanner
    : false

  // 2) if the flag is off, bail immediately
  if (!showBannerConfig) {
    return res.status(200).json({ showBanner: false })
  }

  // 3) otherwise, run your “last‐shown” cookie logic
  const last     = await getCookie('banner_last_shown', { req, res })
  const now      = Date.now()
  const ageDays  = last
    ? (now - Number(last)) / (1000 * 60 * 60 * 24)
    : Infinity

  if (!last || ageDays >= 2) {
    // reset timer
    await setCookie('banner_last_shown', String(now), {
      req,
      res,
      maxAge: 60 * 60 * 24 * 365,  // 1 year
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return res.status(200).json({ showBanner: true })
  }

  // 4) don’t show if it’s been under 2 days
  return res.status(200).json({ showBanner: false })
}