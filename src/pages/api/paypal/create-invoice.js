export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      currency = "USD",
      items = [],
      payer,                 // { email_address, name? }
      note,
      customId: customIdRaw, // MUST equal signatures/{id}
      reference,             // orderId (optional lookup if customId missing)
      dueDate,
      allowPartial = false,
      minPartialValue,
      forceNew = false,      // <<< set true to always mint a fresh invoice number
      chatId,                // <<< NEW: chat ID for logging/messaging
      timestamp,             // <<< NEW: timestamp from parent component
    } = req.body || {};


    let customId = (customIdRaw || "").trim();
    if (!customId) {
      if (!reference) {
        return res.status(400).json({ ok: false, stage: "validate", error: "customId or reference required" });
      }
      // Resolve signatureId by orderId
      try {
        const admin = (await import("firebase-admin")).default;
        if (!admin.apps.length) admin.initializeApp();
        const db = admin.firestore();
        const q = await db.collection("signatures")
          .where("orderId", "==", String(reference))
          .orderBy("createdAt", "desc").limit(1).get();
        if (!q.empty) customId = q.docs[0].id;
        else return res.status(409).json({ ok: false, stage: "resolve", error: "Signature not ready. Retry shortly." });
      } catch (e) {
        return res.status(500).json({ ok: false, stage: "resolve", error: String(e?.message || e) });
      }
    }

    const token = await getAccessToken();
    const norm2 = (n) => (Number(n || 0)).toFixed(2);
    const sanitize = (s, max = 25) => String(s || "").replace(/[^A-Za-z0-9._-]/g, "-").slice(0, max);
    const clamp = (s, max) => (s ? String(s).slice(0, max) : undefined);
    // helper: remove undefined keys
    const prune = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
    const forceItemBreaks = (s) => s ? String(s).replace(/\r?\n/g, "\u2028") : undefined;
    const normalizeMultiline = (s) => (s ? String(s).replace(/\r?\n/g, "\r\n") : undefined);
    const mappedItems = (items?.length ? items : [
      { name: "Vehicle", quantity: "1", unit_amount: { value: "100.00" } }
    ]).map((it) => prune({
      name: clamp(it.name, 200),
      // ⚠️ PayPal often collapses \n; use \u2028 to force visible line breaks
      description: clamp(forceItemBreaks(it.description), 2000),
      quantity: String(Math.max(1, parseInt(it.quantity ?? "1", 10))),
      unit_amount: {
        currency_code: currency,
        value: norm2(it.unit_amount?.value ?? "0.00"),
      },
      unit_of_measure: it.unit_of_measure || undefined,
      reference: clamp(it.reference, 60),
      tax: it.tax
        ? prune({
          name: clamp(it.tax.name, 60),
          percent: it.tax.percent != null ? String(it.tax.percent) : undefined,
        })
        : undefined,
    }));


    // Base invoice_number = signatureId
    let invoiceNumber = sanitize(customId);

    // Check if an invoice with this invoice_number exists
    let invoiceId = await findByInvoiceNumber(invoiceNumber, token);
    let existingStatus = null;

    if (invoiceId) {
      // Read status
      const infoResp = await fetch(`${apiBase()}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const info = await infoResp.json();
      existingStatus = info?.status || null;

      // If caller asked for a fresh invoice, ALWAYS mint a new invoice_number (even if old is SENT)
      if (forceNew) {
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        invoiceNumber = sanitize(`${customId}-R${suffix}`);
        invoiceId = null; // force create path
      } else if (existingStatus === "PAID") {
        // Block recreating on a paid signature unless forceNew requested
        return res.status(409).json({
          ok: false,
          stage: "validate",
          error: "This signature already has a PAID invoice.",
          invoiceId,
        });
      }
      // else: reuse the existing SENT/DRAFT invoice
    }

    const payload = {
      detail: {
        currency_code: currency,
        invoice_number: invoiceNumber, // == customId or customId-RXXXX when forceNew
        reference: customId,           // for webhook correlation
        note,
        ...(dueDate ? { payment_term: { due_date: dueDate } } : {}),
      },
      primary_recipients: payer?.email_address
        ? [{ billing_info: { email_address: payer.email_address, name: payer.name } }]
        : [],
      items: mappedItems
    };
    payload.detail.note = normalizeMultiline(payload.detail.note || req.body.longDescription);

    // CREATE if needed
    if (!invoiceId) {
      const createResp = await fetch(`${apiBase()}/v2/invoicing/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Prefer: "return=representation",
          "PayPal-Request-Id": invoiceNumber, // PayPal-side idempotency
        },
        body: JSON.stringify(payload),
      });
      const draft = await createResp.json();
      if (!createResp.ok) {
        return res.status(createResp.status).json({ ok: false, stage: "create", error: draft });
      }
      invoiceId = draft?.id || (await followLocationToId(createResp, token));
      if (!invoiceId) {
        return res.status(502).json({ ok: false, stage: "create-followup", message: "No invoice id" });
      }

      // Best-effort: pin invoiceId to signatures/{customId}
      try {
        const admin = (await import("firebase-admin")).default;
        if (!admin.apps.length) admin.initializeApp();
        const db = admin.firestore();
        await db.collection("signatures").doc(String(customId))
          .set({ paypal: { invoiceId: String(invoiceId) } }, { merge: true });
      } catch (e) {
        console.warn("[create-invoice] pin invoiceId failed:", e?.message || e);
      }
    }

    // SEND (if already sent, GET and return link)
    let hostedUrl = null;
    const sendResp = await fetch(`${apiBase()}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
        "PayPal-Request-Id": `${invoiceNumber}:send`,
      },
      body: JSON.stringify({ send_to_recipient: true, send_to_invoicer: false }),
    });

    if (sendResp.ok) {
      const sent = await sendResp.json();
      hostedUrl = sent?.links?.find((l) => l.rel === "payer_view")?.href || null;
    } else {
      const getResp = await fetch(`${apiBase()}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await getResp.json();
      if (!getResp.ok) {
        return res.status(getResp.status).json({ ok: false, stage: "get", invoiceId, error: data });
      }
      hostedUrl = data?.links?.find((l) => l.rel === "payer_view")?.href || null;
    }

    if (!hostedUrl) hostedUrl = buildHostedPayerUrl(invoiceId);

    // =====================================================
    // NEW LOGIC: Add System Message to Chat
    // =====================================================
    if (chatId) {
      // Use parent timestamp if available, else server-side time (ISO string)
      // This ensures message is sent even if parent didn't pass timestamp prop.
      const msgTimestamp = timestamp || new Date().toISOString();

      try {
        const admin = (await import("firebase-admin")).default;
        if (!admin.apps.length) admin.initializeApp();
        const db = admin.firestore();

        console.log("[PayPal] Posting message to chat:", chatId);

        const messageText =
          "The PayPal invoice has been made.\n\n" +
          "If popup fails please kindly check your email to see the invoice for paypal we have sent to you.\n\n" +
          "You can also pay directly via this link:\n" +
          hostedUrl;
        const msg = {
          sender: "system@paypal-webhook",
          text: messageText,
          timestamp: msgTimestamp,
          ip: "",
          ipCountry: "Japan",
          ipCountryCode: "JP",
        };

        // 1) Add message to chat messages subcollection
        await db
          .collection("chats")
          .doc(chatId)
          .collection("messages")
          .doc()
          .set(msg);

        // 2) Update only basic chat summary
        const chatRef = db.doc(`chats/${chatId}`);
        await chatRef.set(
          {
            lastMessage: msg.text,
            lastMessageDate: msg.timestamp,
            lastMessageSender: msg.sender,
            lastMessageSenderId: "system",
            read: false,
            readBy: [],
          },
          { merge: true }
        );
        console.log("[PayPal] Chat message posted successfully.");
      } catch (msgErr) {
        console.error("[PayPal] Failed to post system message:", msgErr);
        // We don't fail the request if messaging fails
      }
    }
    // ====================================================

    return res.status(200).json({
      ok: true,
      invoiceId,
      hostedUrl,
      paypalInvoiceNumber: invoiceNumber, // == customId or customId-RXXXX when forceNew
      existingStatus,
    });
  } catch (e) {
    console.error("[create-invoice] Error:", e);
    return res.status(500).json({ ok: false, stage: "server", error: String(e?.message || e) });
  }
}



/** helpers **/
function apiBase() {
  const base = (process.env.NEXT_PUBLIC_PAYPAL_BASE_LINK).replace(/\/+$/, "");
  if (!/^https:\/\/api-m(\.sandbox)?\.paypal\.com$/.test(base)) throw new Error(`Invalid PAYPAL_BASE: ${base}`);
  return base;
}
function hostedWebBase() {
  return apiBase().includes(".sandbox.") ? "https://www.sandbox.paypal.com" : "https://www.paypal.com";
}
function buildHostedPayerUrl(id) {
  return `${hostedWebBase()}/invoice/payerView/details/${encodeURIComponent(id)}`;
}
async function getAccessToken() {
  const { NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID, NEXT_PUBLIC_PAYPAL_SECRET } = process.env;
  if (!NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID || !NEXT_PUBLIC_PAYPAL_SECRET) throw new Error("Missing NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID or NEXT_PUBLIC_PAYPAL_SECRET");
  const url = `${apiBase()}/v1/oauth2/token`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID}:${NEXT_PUBLIC_PAYPAL_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await resp.json();
  if (!resp.ok || !data.access_token) throw new Error(`OAuth failed (${resp.status}): ${data.error_description || data.error}`);
  return data.access_token;
}
async function followLocationToId(createResp, token) {
  const location = createResp.headers.get("location");
  if (!location) return null;
  const selfResp = await fetch(location, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  const selfData = await selfResp.json();
  return selfResp.ok ? selfData?.id || null : null;
}
async function findByInvoiceNumber(invoiceNumber, token) {
  const url = `${apiBase()}/v2/invoicing/invoices?invoice_number=${encodeURIComponent(invoiceNumber)}&page_size=1`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.items?.[0]?.id || null;
}