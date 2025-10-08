"use client";

import React from "react";

export default function InvoiceViewer() {
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const u = params.get("u") || "";
      setUrl(u);

      // try an immediate same-tab redirect (fast path for most browsers)
      if (u) {
        // a small delay can improve success in some in-app browsers
        setTimeout(() => {
          try { window.location.replace(u); } catch {}
        }, 50);
      }
    } catch {}
  }, []);

  if (!url) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        Missing invoice URL.
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      fontFamily: "system-ui"
    }}>
      <p>Opening your invoice… If it doesn’t open automatically, tap below or view inline.</p>

      <a
        href={url}
        target="_blank"
        rel="noopener"
        style={{
          padding: "10px 14px",
          border: "1px solid #333",
          borderRadius: 8,
          alignSelf: "flex-start",
          textDecoration: "none"
        }}
      >
        Open in new tab
      </a>

      <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        {/* Inline fallback for in-app browsers that block auto navigation */}
        <iframe title="Invoice PDF" src={url} style={{ width: "100%", height: "100%", border: 0 }} />
      </div>
    </div>
  );
}
