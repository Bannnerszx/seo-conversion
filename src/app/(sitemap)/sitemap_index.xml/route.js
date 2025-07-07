import { NextResponse } from "next/server";
import { admin } from "@/lib/firebaseAdmin";
const PAGE_SIZE = 2000
const JSON_PATH = 'sitemap_product/VehicleProducts.json'

async function loadProductsJson() {
    const bucket = admin.storage().bucket()
    const file = bucket.file(JSON_PATH)
    const [buffer] = await file.download()
    return JSON.parse(buffer.toString())
}

/**
 * Tell Next.js how many sitemap files to spin up under /products/sitemap/[id].xml
 */
export async function generateSitemaps() {
    // load the pre‐exported array from Storage
    const items = await loadProductsJson()
    const total = items.length

    // compute how many pages
    const pages = Math.ceil(total / PAGE_SIZE)

    // one chunk per page: [ "0", "1", …, `${pages-1}` ]
    return Array.from({ length: pages }, (_, i) => ({ id: i.toString() }))
}


export async function GET() {
    try {
        // Generate sitemaps
        const dynamicSitemaps = await generateSitemaps();

        // Combine static and dynamic sitemaps
        const base = process.env.NEXT_PUBLIC_APP_URL
        const sitemaps = [
            `${base}/sitemap.xml`,
            ...dynamicSitemaps.map(({ id }) =>
                // build each chunk’s URL from its id
                `${base}/product/sitemap/${id}.xml`
            )

        ]

        console.log('Generated sitemaps:', sitemaps);

        const sitemapIndexXML = await buildSitemapIndex(sitemaps);

        return new NextResponse(sitemapIndexXML, {
            headers: {
                "Content-Type": "application/xml",
                "Content-Length": Buffer.byteLength(sitemapIndexXML).toString(),
            },
        });
    } catch (error) {
        console.error('Error generating sitemap index:', error);
        return NextResponse.error();
    }
}

async function buildSitemapIndex(sitemaps) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    for (const sitemapURL of sitemaps) {
        xml += "<sitemap>";
        xml += `<loc>${sitemapURL}</loc>`;
        xml += "</sitemap>";
    }

    xml += "</sitemapindex>";
    return xml;
}