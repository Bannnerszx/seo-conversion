// pages/api/simulate-payment.js

export default async function handler(req, res) {
  // 1. Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 2. Get data from the client
    const { invoiceId, amount, currency = "USD", note } = req.body;

    if (!invoiceId || !amount) {
      return res.status(400).json({ error: "Missing invoiceId or amount" });
    }

    // 3. Get the Access Token (Authentication)
    const token = await getAccessToken();

    // 4. Construct the PayPal API URL
    const url = `${apiBase()}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/payments`;

    // 5. Send the request to PayPal
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        method: "CASH", // We tell PayPal this was paid via Cash/External
        payment_date: new Date().toISOString().split("T")[0],
        amount: {
          currency_code: currency,
          value: String(amount),
        },
        note: note || "Simulated partial payment via API",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ ok: false, error: data });
    }

    // 6. Return success
    return res.status(200).json({ 
      ok: true, 
      paymentId: data.payment_id,
      message: "Payment recorded successfully" 
    });

  } catch (e) {
    console.error("[simulate-payment] Error:", e);
    return res.status(500).json({ error: e.message });
  }
}

// --- HELPER FUNCTIONS (Same as in your create-invoice.js) ---

function apiBase() {
  const base = (process.env.NEXT_PUBLIC_PAYPAL_BASE || "").replace(/\/+$/, "");
  // Default to sandbox if env var is missing
  return base || "https://api-m.sandbox.paypal.com";
}

async function getAccessToken() {
  const { NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID, NEXT_PUBLIC_PAYPAL_SECRET } = process.env;
  
  if (!NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID || !NEXT_PUBLIC_PAYPAL_SECRET) {
    throw new Error("Missing PayPal Credentials in .env");
  }

  const url = `${apiBase()}/v1/oauth2/token`;
  const auth = Buffer.from(
    `${NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID}:${NEXT_PUBLIC_PAYPAL_SECRET}`
  ).toString("base64");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error_description || "Failed to get access token");
  }
  return data.access_token;
}