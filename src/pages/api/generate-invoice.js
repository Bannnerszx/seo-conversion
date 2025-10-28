

import QRCode from 'qrcode';

// Optional: increase body limit if your payload is large
export const config = {
    api: {
        bodyParser: { sizeLimit: '10mb' }, // tweak as needed
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // 👇 Accept either JSON body or form post with a "json" field
        let payload = req.body || {};
        if (typeof payload?.json === 'string') {
            try { payload = JSON.parse(payload.json); } catch { /* ignore, keep as {} */ }
        }

        const { chatId, userEmail, isProforma, invoiceData, selectedChatData } = payload;

        // 1) Build HTML
        const html = await generateInvoiceHTML(invoiceData, selectedChatData, !!isProforma);

        // 2) Render to PDF
        const pdfBuffer = await generatePDF(html);

        // 3) Stream PDF straight to the browser tab
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="invoice.pdf"');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Length', String(pdfBuffer.length));

        // ✅ Write raw bytes — do NOT use res.json()
        res.statusCode = 200;
        res.end(pdfBuffer);
        return;
    } catch (err) {
        console.error('generate-invoice API error:', err);
        return res.status(500).json({ success: false, message: err?.message || 'Failed to generate invoice' });
    }
}


async function generatePDF(html) {
    let browser;
    try {
        // Detect prod/serverless vs local dev
        const isServerless =
            !!process.env.AWS_REGION ||
            !!process.env.AWS_LAMBDA_FUNCTION_VERSION ||
            !!process.env.VERCEL;

        let puppeteerLib, launchOptions;

        if (isServerless) {
            // ---- PROD/LAMBDA/VERCEL: use puppeteer-core + @sparticuz/chromium
            const chromium = (await import('@sparticuz/chromium')).default;
            puppeteerLib = (await import('puppeteer-core')).default;

            const execPath = await chromium.executablePath();

            launchOptions = {
                args: chromium.args,
                executablePath: execPath,
                headless: chromium.headless,
                defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
            };
        } else {
            // ---- LOCAL DEV (Windows/Mac/Linux): use full puppeteer
            // This downloads/uses a working Chromium for your platform.
            puppeteerLib = (await import('puppeteer')).default;

            // If you prefer your installed Chrome instead, set PUPPETEER_EXECUTABLE_PATH
            // in .env.local and uncomment executablePath below.
            launchOptions = {
                headless: true,
                // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
            };
        }

        browser = await puppeteerLib.launch(launchOptions);
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Ensure assets are loaded
        await page.evaluate(async () => {
            await Promise.all(
                [...document.images].map((img) =>
                    img.complete
                        ? null
                        : new Promise((r) => {
                            img.addEventListener('load', r);
                            img.addEventListener('error', r);
                        })
                )
            );
            if (document.fonts?.ready) await document.fonts.ready;
        });

        return await page.pdf({
            width: '794px',
            height: '1123px',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
            pageRanges: '1',
        });
    } finally {
        if (browser) await browser.close();
    }
}

async function generateInvoiceHTML(invoiceData, selectedChatData, isProforma) {
    // == helpers ==
    const safe = (v) => (v == null ? '' : v);
    const s = (v) => String(safe(v));
    const num = (v) => {
        const x = typeof v === 'string' ? v.replace(/[^0-9.\-]/g, '') : v;
        const n = Number(x);
        return Number.isFinite(n) ? n : 0;
    };
    const toDateObj = (x) => {
        if (!x) return null;
        try {
            return x && typeof x === 'object' && typeof x.toDate === 'function' ? x.toDate() : new Date(x);
        } catch {
            return null;
        }
    };
    const fmtDate = (x) => {
        const d = toDateObj(x);
        return d && !isNaN(d.getTime())
            ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            : '';
    };

    // == currency ==
    const sym = { USD: '$', JPY: '¥', EUR: '€', AUD: 'A$', GBP: '£', CAD: 'C$' };
    const usdTo = {
        JPY: num(selectedChatData?.currency?.usdToJpy) || 1,
        EUR: num(selectedChatData?.currency?.usdToEur) || 1,
        AUD: num(selectedChatData?.currency?.usdToAud) || 1,
        GBP: num(selectedChatData?.currency?.usdToGbp) || 1,
        CAD: num(selectedChatData?.currency?.usdToCad) || 1,
    };
    const selCur = s(invoiceData?.selectedCurrencyExchange || 'USD').toUpperCase();
    const conv = (usd) => {
        const base = num(usd);
        if (selCur === 'USD') return `${sym.USD}${base.toLocaleString('en-US')}`;
        const mult = usdTo[selCur] || 1;
        return `${sym[selCur] || ''}${Math.round(base * mult).toLocaleString('en-US')}`;
    };

    const stepVal = Number(selectedChatData?.stepIndicator?.value ?? 0);
    const isFinal = !isProforma && stepVal >= 3;
    const titleText = stepVal < 3 ? 'PROFORMA INVOICE' : 'INVOICE';
    const invoiceNumber = s(selectedChatData?.invoiceNumber);
    const formattedIssuingDate = fmtDate(invoiceData?.bankInformations?.issuingDate);
    const formattedDueDate = fmtDate(invoiceData?.bankInformations?.dueDate);

    const fobPrice = num(invoiceData?.paymentDetails?.fobPrice);
    const freightPrice = num(invoiceData?.paymentDetails?.freightPrice);
    const inspectionOn = !!invoiceData?.paymentDetails?.inspectionIsChecked;
    const inspectionPrice = inspectionOn ? num(invoiceData?.paymentDetails?.inspectionPrice) : 0;
    const incoterms = s(invoiceData?.paymentDetails?.incoterms);
    const insurancePrice = incoterms === 'CIF' ? num(invoiceData?.paymentDetails?.insurancePrice) : 0;
    const addlPrices = Array.isArray(invoiceData?.paymentDetails?.additionalPrice)
        ? invoiceData.paymentDetails.additionalPrice.map(num).filter(Number.isFinite)
        : [];
    const addlNames = Array.isArray(invoiceData?.paymentDetails?.additionalName)
        ? invoiceData.paymentDetails.additionalName.map(s).filter(Boolean)
        : [];
    const baseTotalUSD =
        fobPrice +
        freightPrice +
        inspectionPrice +
        insurancePrice +
        addlPrices.reduce((t, x) => t + x, 0);
    const totalPriceCalculated = () => conv(baseTotalUSD);

    // QR (final only)
    let qrHtml = '';
    if (isFinal && s(invoiceData?.cryptoNumber).trim()) {
        const qrDataUrl = await QRCode.toDataURL(s(invoiceData.cryptoNumber).trim(), {
            width: 80,
            margin: 0,
        });
        qrHtml = `
      <div id="qr" style="position:absolute; right:38px; top:38px; width:80px; height:80px; display:flex; align-items:center; justify-content:center; background:#fff;">
        <img src="${qrDataUrl}" alt="Payment QR" style="width:100%;height:100%;display:block;" />
      </div>`;
    }

    const labelParts = [];
    const amtParts = [];
    if (inspectionOn && (incoterms === 'C&F' || incoterms === 'FOB')) {
        labelParts.push(`Inspection [${s(invoiceData?.paymentDetails?.inspectionName)}]`);
        amtParts.push(conv(inspectionPrice));
    } else if (inspectionOn && incoterms === 'CIF') {
        labelParts.push(`Inspection [${s(invoiceData?.paymentDetails?.inspectionName)}] + Insurance`);
        amtParts.push(`${conv(inspectionPrice)} + ${conv(insurancePrice)}`);
    } else if (!inspectionOn && incoterms === 'CIF') {
        labelParts.push('Insurance');
        amtParts.push(conv(insurancePrice));
    }

    const addlNameJoined = addlNames.length ? addlNames.join(' + ') : '';
    const addlValueJoined = addlPrices.length ? addlPrices.map(conv).join(' + ') : '';

    const carName = s(invoiceData?.carData?.carName);
    const chassis = s(invoiceData?.carData?.chassisNumber);
    const exterior = s(invoiceData?.carData?.exteriorColor);
    const disp =
        invoiceData?.carData?.engineDisplacement != null
            ? `${num(invoiceData?.carData?.engineDisplacement).toLocaleString('en-US')} cc`
            : '';
    const mileage =
        invoiceData?.carData?.mileage != null
            ? `${num(invoiceData?.carData?.mileage).toLocaleString('en-US')} km`
            : '';
    const fuel = s(invoiceData?.carData?.fuel);
    const trans = s(invoiceData?.carData?.transmission);
    const incotermPort =
        incoterms && s(invoiceData?.discharge?.port)
            ? `${incoterms} ${s(invoiceData?.discharge?.port)}`
            : '';

    const tableTop = s(invoiceData?.placeOfDelivery) && s(invoiceData?.cfs) ? 577 : 537;

    const rmjLogoUrl =
        'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2FRMJ%20logo%20for%20invoice.png?alt=media&token=0326ca6c-0e5b-4e25-8248-fbeb7b057b60';
    const hankoUrl =
        'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2FRMJ%20Invoice%20Signature%20with%20Hanko.png?alt=media&token=2f331216-8605-4225-b74f-ce9447757341';

    return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8" />
  <title>Invoice</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin:0; padding:0; background:#fff; }
    #invoice-root {
      position: relative; width: 794px; height: 1123px; background: #fff;
      box-sizing: border-box; font-family: Arial, Helvetica, sans-serif;
    }
  </style>
</head>
<body>
  <div id="invoice-root">
    <img src="${rmjLogoUrl}" alt="RMJ Logo"
         style="position:absolute; left:38px; top:38px; width:95px; height:85px; object-fit:fill; display:block;" />
    <h1 style="position:absolute; left:50%; transform:translateX(-50%); top:80px; margin:0; font-weight:700; font-size:25px; line-height:1; white-space:nowrap;">
      ${titleText}
    </h1>

    ${stepVal < 3
            ? `
      <div style="position:absolute; right:38px; top:34px;">
        <div style="display:flex; gap:6px; justify-content:flex-end; font-size:14px;">
          <span style="font-weight:750;">Issuing Date:</span>
          <span>${s(formattedIssuingDate)}</span>
        </div>
        <div style="display:flex; gap:6px; justify-content:flex-end; font-size:14px;">
          <span style="font-weight:750; color:#F00A0A;">Valid Until:</span>
          <span>${s(formattedDueDate)}</span>
        </div>
      </div>`
            : `
      ${isFinal && s(selectedChatData?.invoiceNumber) ? `<div style="position:absolute; right:121px; top:34px; font-weight:750; font-size:14px;">Invoice No. RMJ-${s(selectedChatData?.invoiceNumber)}</div>` : ""}
      <div style="position:absolute; right:121px; top:49px; font-size:14px;">
        <span style="font-weight:750;">Issuing Date: </span>
        <span>${s(formattedIssuingDate)}</span>
      </div>`
        }

    ${qrHtml}

    <div style="position:absolute; left:40px; top:134px; width:280px;">
      <div style="font-weight:750; font-size:16px; border-bottom:3px solid #000; display:inline-block; margin-bottom:5px;">Shipper</div>
      <div style="font-weight:750; font-size:14px; line-height:14px;">Real Motor Japan (YANAGISAWA HD CO.,LTD)</div>
      <div style="font-weight:400; font-size:14px; margin-top:8px; line-height:14px;">26-2 Takara Tsutsumi-cho Toyota City, Aichi Prefecture, Japan, 473-0932</div>
      <div style="font-weight:400; font-size:14px; margin-top:8px; line-height:14px;">FAX: +81565850606</div>

      <div style="font-weight:700; font-size:14px; margin-top:8px; line-height:7px;">Shipped From:</div>
      <div style="font-weight:400; font-size:14px; margin-top:8px; line-height:7px;">${s(invoiceData?.departurePort)}, ${s(invoiceData?.departureCountry)}</div>

      <div style="font-weight:700; font-size:14px; margin-top:8px; line-height:14px;">Shipped To:</div>
      <div style="font-weight:400; font-size:14px; margin-top:6px; line-height:14px;">${s(invoiceData?.discharge?.port)}, ${s(invoiceData?.discharge?.country)}</div>

      ${s(invoiceData?.placeOfDelivery) ? `
        <div style="font-weight:700; font-size:14px; margin-top:8px; line-height:14px;">Place of Delivery:</div>
        <div style="font-weight:400; font-size:14px; margin-top:8px; line-height:14px;">${s(invoiceData?.placeOfDelivery)}</div>` : ""}

      ${s(invoiceData?.cfs) ? `
        <div style="font-weight:700; font-size:14px; margin-top:20px; line-height:14px;">CFS:</div>
        <div style="font-weight:400; font-size:14px; line-height:14px;">${s(invoiceData?.cfs)}</div>` : ""}

      <div style="display:flex; flex-direction:row; width:715px; margin-top:25px;">
        <div style="flex:1; min-width:280px;">
          <div style="font-weight:750; font-size:18px; color:#0A78BE; border-bottom:3px solid #0A78BE; display:inline-block; margin-bottom:5px;">Buyer Information</div>
          <div style="font-weight:750; font-size:16px; line-height:14px;">${s(invoiceData?.consignee?.name)}</div>
          <div style="font-weight:400; font-size:16px; margin-top:6px; line-height:14px;">${s(invoiceData?.consignee?.address)}, ${s(invoiceData?.consignee?.city)}, ${s(invoiceData?.consignee?.country)}</div>
          <div style="font-weight:400; font-size:16px; margin-top:6px; line-height:14px;">${s(invoiceData?.consignee?.email)}</div>
          <div style="font-weight:400; font-size:16px; margin-top:6px; line-height:14px;">${s(invoiceData?.consignee?.contactNumber)}</div>
          <div style="font-weight:400; font-size:16px; margin-top:6px; line-height:14px;">FAX: ${s(invoiceData?.consignee?.fax) ? s(invoiceData?.consignee?.fax) : 'N/A'}</div>
        </div>

        <div style="flex:1; padding-left:20px;">
          <div style="font-weight:750; font-size:18px; color:#FF0000; border-bottom:3px solid #FF0000; display:inline-block; margin-bottom:5px;">Notify Party</div>
          ${invoiceData?.notifyParty?.sameAsConsignee
            ? `<div style="font-weight:400; font-size:16px;">Same as consignee / buyer</div>`
            : `
                <div style="font-weight:750; font-size:16px; line-height:14px;">${s(invoiceData?.notifyParty?.name)}</div>
                <div style="font-weight:400; font-size:16px; margin-top:20px; line-height:14px;">${s(invoiceData?.notifyParty?.address)}</div>
                <div style="font-weight:400; font-size:16px; margin-top:20px; line-height:14px;">${s(invoiceData?.notifyParty?.email)}</div>
                <div style="font-weight:400; font-size:16px; margin-top:20px; line-height:14px;">${s(invoiceData?.notifyParty?.contactNumber)}</div>
                <div style="font-weight:400; font-size:16px; margin-top:20px; line-height:14px;">FAX: ${s(invoiceData?.notifyParty?.fax) ? s(invoiceData?.notifyParty?.fax) : 'N/A'}</div>
              `
        }
        </div>
      </div>
    </div>

    ${stepVal < 3
            ? `
      <div style="position:absolute; right:38px; top:130px; width:430px; height:194px; border:3px solid #FF5C00;">
        <div style="height:100%; display:flex; align-items:center; justify-content:center;">
          <div style="font-weight:750; font-size:12px; color:#FF0000;">
            Bank Information will be provided after placing an order.
          </div>
        </div>
      </div>`
            : `
      <div style="position:absolute; right:38px; top:130px; width:430px; border:3px solid #1ABA3D;">
        <div style="text-align:center; font-weight:750; font-size:14px; color:#114B33; padding:8px 0;">Bank Information</div>
        <div style="display:flex; flex-direction:row; gap:50px; padding:5px;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:750; font-size:14px; border-bottom:3px solid #000; display:inline-block;">Bank Account</div>
            <div style="font-weight:750; font-size:12px; margin-top:3px;">Bank Name: <span style="font-weight:400;">${s(invoiceData?.bankInformations?.bankAccount?.bankName)}</span></div>
            <div style="font-weight:750; font-size:12px; margin-top:3px;">Branch Name: <span style="font-weight:400;">${s(invoiceData?.bankInformations?.bankAccount?.branchName)}</span></div>
            <div style="font-weight:750; font-size:12px; margin-top:3px;">SWIFTCODE: <span style="font-weight:400;">${s(invoiceData?.bankInformations?.bankAccount?.swiftCode)}</span></div>
            <div style="font-weight:750; font-size:12px; margin-top:3px;">Address: <span style="font-weight:400;">${s(invoiceData?.bankInformations?.bankAccount?.address)}</span></div>
            <div style="font-weight:750; font-size:12px; margin-top:3px;">Name of Account Holder: <span style="font-weight:400;">${s(invoiceData?.bankInformations?.bankAccount?.accountHolder)}</span></div>
            <div style="font-weight:750; font-size:12px; margin:3px 0;">Account Number: <span style="font-weight:400;">${s(invoiceData?.bankInformations?.bankAccount?.accountNumberValue)}</span></div>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:750; font-size:14px; border-bottom:3px solid #000; display:inline-block;">Payment Terms</div>
            <div style="font-weight:750; font-size:12px;">Terms: <span style="font-weight:400;">${s(invoiceData?.bankInformations?.paymentTerms)}</span></div>
            <div style="padding-top:30px;">
              <div style="font-weight:750; font-size:14px; color:#F00A0A; border-bottom:3px solid #F00A0A; display:inline-block;">Payment Due</div>
              <div style="font-weight:750; font-size:12px; color:#F00A0A;">Due Date: <span style="font-weight:400; color:#000;">${s(formattedDueDate)}</span></div>
            </div>
          </div>
        </div>
      </div>`
        }

    <div style="position:absolute; left:38px; top:${tableTop}px; width:718px; border:1px solid #C2E2F4; box-sizing:border-box;">
      <div style="display:flex; flex-direction:row;">
        <div style="flex:2; text-align:center; color:#008AC6; font-weight:bold; font-size:12px; padding:10px 0;">Description</div>
        <div style="flex:2; text-align:center; color:#008AC6; font-weight:bold; font-size:12px; padding:10px 0;">Notes</div>
        <div style="flex:1; text-align:center; color:#008AC6; font-weight:bold; font-size:12px; padding:10px 0;">Quantity</div>
        <div style="flex:2; text-align:center; color:#008AC6; font-weight:bold; font-size:12px; padding:10px 0;">Amount</div>
      </div>

      <div style="display:flex; flex-direction:row; border-top:1px solid #C2E2F4;">
        <div style="flex:5; padding:3px 2px; font-size:12px;">FOB</div>
        <div style="flex:2; display:flex; align-items:center; justify-content:center; font-size:12px;">${conv(fobPrice)}</div>
      </div>

      <div style="display:flex; flex-direction:row; border-top:1px solid #C2E2F4;">
        <div style="flex:5; padding:3px 2px; font-size:12px;">Freight</div>
        <div style="flex:2; display:flex; align-items:center; justify-content:center; font-size:12px;">${conv(freightPrice)}</div>
      </div>

      <div style="display:flex; flex-direction:row; border-top:1px solid #C2E2F4;">
        <div style="flex:5; padding:3px 2px; font-size:12px;">${labelParts.join(' ')}</div>
        <div style="flex:2; display:flex; align-items:center; justify-content:center; font-size:12px;">${amtParts.join(' ')}</div>
      </div>

      <div style="display:flex; flex-direction:row; border-top:1px solid #C2E2F4;">
        <div style="flex:5; padding:3px 2px; font-size:12px;">${addlNameJoined}</div>
        <div style="flex:2; display:flex; align-items:center; justify-content:center; font-size:12px;">${addlValueJoined || '&nbsp;'}</div>
      </div>

      <div style="display:flex; flex-direction:row; border-top:1px solid #C2E2F4; padding:2px 0;">
        <div style="flex:2; padding:2px 2px; white-space:pre-line; font-size:12px;">
          ${carName
            ? `Used Vehicle\n<b style="font-weight:700">${carName}</b>\n${chassis}\n${exterior}\n${disp}\n${mileage}\n${fuel}\n${trans}`
            : '&nbsp;'
        }
        </div>
        <div style="flex:2; display:flex; align-items:center; justify-content:center; font-size:12px;">${incotermPort || '&nbsp;'}</div>
        <div style="flex:1; display:flex; align-items:center; justify-content:center; font-size:12px;">${carName ? '1' : '&nbsp;'}</div>
        <div style="flex:2; position:relative; min-height:40px;">
          ${baseTotalUSD > 0
            ? `<div style="position:absolute; top:51px; left:50px; transform:translate(-50%, -50%);">
                   <span style="color:#008AC6; font-weight:700; font-size:12px;">Total</span>
                   <span style="color:#00720B; font-weight:700; font-size:12px; margin-left:5px;">${totalPriceCalculated()}</span>
                 </div>`
            : '&nbsp;'
        }
        </div>
      </div>
    </div>

    <div style="position:absolute; left:38px; top:825px; width:350px;">
      <div style="font-weight:700; font-size:12px; line-height:14px;">Payment Information:</div>
      <div style="font-weight:400; font-size:12px; line-height:14px;">
        The customer is responsible for the bank charges incurred when the T/T (Telegraphic Transfer) is paid.
      </div>
      <div style="font-weight:400; font-size:12px; line-height:14px; margin-bottom:5px;">
        No warranty service is provided on used vehicles.
      </div>

      <div style="font-weight:700; font-size:12px; line-height:14px;">Conditions for order cancellation:</div>
      <div style="font-weight:400; font-size:12px; line-height:14px;">
        (1) Order Cancellation Penalty: If the order is cancelled after payment, a penalty of USD 220 will apply.
      </div>
      <div style="font-weight:400; font-size:12px; line-height:14px; margin-bottom:5px;">
        (2) Non-refund: Payment for vehicles purchased through pre-delivery inspection is non-refundable.
      </div>

      <div style="font-weight:700; font-size:12px; line-height:14px;">Intermediary Banking Information:</div>
      <div style="font-weight:400; font-size:12px; line-height:14px;">Bank Name: SUMITOMO MITSUI BANKING CORPORATION (NEW YORK BRANCH).</div>
      <div style="font-weight:400; font-size:12px; line-height:14px;">Swift code: SMBCUS33</div>
      <div style="font-weight:400; font-size:12px; line-height:14px;">Address: 277 Park Avenue</div>
      <div style="font-weight:400; font-size:12px; line-height:14px;">City: New York, NY</div>
      <div style="font-weight:400; font-size:12px; line-height:14px;">Postal Code: 10172</div>
      <div style="font-weight:400; font-size:12px; line-height:14px; margin-bottom:5px;">Country: United States</div>
    </div>

    ${isFinal
            ? `
      <div style="position:absolute; right:39px; top:835px; width:300px;">
        <div style="width:100%; text-align:center; padding-bottom:80px;">
          <img src="${hankoUrl}" alt="RMJ Signature"
               style="width:276px; height:81px; object-fit:contain; display:block; margin:0 auto;" />
          <div style="border-bottom:1px solid #000; width:100%;"></div>
          <div style="font-weight:700; font-style:italic; font-size:16px;">Real Motor Japan</div>
        </div>
        <div style="width:100%; text-align:center; padding-bottom:5px;">
          <div style="border-bottom:1px solid #000; width:100%;"></div>
          <div style="font-weight:700; font-style:italic; font-size:16px;">Your Signature</div>
        </div>
      </div>`
            : ''
        }

  </div>
</body></html>`;
}
