"use client";
import React from "react";

export default function InvoiceViewer() {
  const [directUrl, setDirectUrl] = React.useState("");
  const [proxyUrl, setProxyUrl] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const u = params.get("u") || "";
      setDirectUrl(u);
      setProxyUrl(`/api/proxy-pdf?u=${encodeURIComponent(u)}`);

      // Try fast same-tab redirect to the direct URL
      // If the browser blocks or shows nothing, user still has the iframe & button below.
      if (u) {
        setTimeout(() => {
          try { window.location.replace(u); } catch {}
        }, 50);
      }
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, []);

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      gap: 12, padding: 12, fontFamily: "system-ui"
    }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>Invoice Viewer</h1>

      {err && (
        <div style={{ color: "#b00" }}>Error: {err}</div>
      )}

      {!directUrl && (
        <div>Missing invoice URL.</div>
      )}

      {directUrl && (
        <>
          <p>Opening your invoice… If it doesn’t open, use the options below.</p>

          {/* Manual open button (direct link) */}
          <a
            href={directUrl}
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-block",
              padding: "10px 14px",
              border: "1px solid #333",
              borderRadius: 8,
              textDecoration: "none"
            }}
          >
            Open in new tab (direct)
          </a>

          {/* Inline, same-origin proxy iframe (most reliable on mobile) */}
          <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            <iframe
              title="Invoice PDF"
              src={proxyUrl}
              style={{ width: "100%", height: "100%", border: 0 }}
              onError={() => setErr("Failed to load inline viewer")}
            />
          </div>
        </>
      )}
    </div>
  );
}
