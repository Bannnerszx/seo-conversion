"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function PayPalProvider({ children }) {
  // ← At build-time this must be a real string, not undefined
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID;

  if (!clientId) {
    // Helpful error UI so you immediately see what's wrong
    if (typeof window !== "undefined") {
      console.error("PayPal: NEXT_PUBLIC_PAYPAL_CLIENT_ID is missing.");
    }
    return (
      <div style={{ padding: 16, color: "red" }}>
        PayPal config error: <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> is missing.
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,           // REQUIRED
        components: "buttons",
        currency: "USD",
        intent: "capture",
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
