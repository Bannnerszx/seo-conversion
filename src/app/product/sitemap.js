// app/products/sitemap.js
import { admin } from '@/lib/firebaseAdmin'   // your existing Admin SDK import

const PAGE_SIZE   = 2000
export const revalidate = 10800  // every 3h

const JSON_PATH = 'sitemap_product/VehicleProducts.json'

/** Download & parse the JSON blob from GCS */
async function loadProductsJson() {
  const bucket = admin.storage().bucket()
  const file   = bucket.file(JSON_PATH)
  const [buffer] = await file.download()
  return JSON.parse(buffer.toString())
}

/**
 * Tell Next.js how many sitemap files to spin up under
 * /products/sitemap/[id].xml
 */
export async function generateSitemaps() {
  const items = await loadProductsJson()
  const pages = Math.ceil(items.length / PAGE_SIZE)
  return Array.from({ length: pages }, (_, i) => ({ id: i.toString() }))
}

/**
 * Called for each { id } → serve
 * /products/sitemap-0.xml, /products/sitemap-1.xml, …
 */
export default async function sitemap({ id }) {
  const BASE_URL = 'https://dev.realmotor.jp'
  const base     = `${BASE_URL}/product`

  const pageNum = parseInt(id, 10)
  const offset  = pageNum * PAGE_SIZE

  // pull in the full JSON once
  const items = await loadProductsJson()

  // slice out just this page
  const chunk = items.slice(offset, offset + PAGE_SIZE)

  return chunk.map(item => ({
    url: `${base}/${encodeURIComponent(item.id)}`,
    // if your JSON export includes a timestamp field (e.g. `updatedAt`),
    // you can use it here:
    lastModified: item.updatedAt ? new Date(item.updatedAt) : undefined,
  }))
}
