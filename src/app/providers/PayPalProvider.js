"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function PayPalProvider({ children }) {
  const rawClientId =  process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID ;


  const clientId = rawClientId?.trim(); // trim just in case

  if (typeof window !== "undefined") {
    console.log("PayPal clientId from env:", JSON.stringify(rawClientId));
  }

  if (!clientId) {
    if (typeof window !== "undefined") {
      console.error(
        "PayPal: NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID is missing or empty."
      );
    }
    return (
      <div style={{ padding: 16, color: "red" }}>
        PayPal config error:{" "}
        <code>NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID</code> is missing.
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        components: "buttons",
        currency: "USD",
        intent: "capture",
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
