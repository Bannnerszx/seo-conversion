"use client";
import React from "react";

export default function InvoiceViewer() {
  const [directUrl, setDirectUrl] = React.useState("");
  const [proxyUrl, setProxyUrl] = React.useState("");
  const [err, setErr] = React.useState("");
  const didAutoRef = React.useRef(false); // prevent double-runs

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const u = params.get("u") || "";
      const autoParam = params.get("auto"); // "0" | "1" | null
      const autoOpen = autoParam === null ? true : autoParam === "1";

      setDirectUrl(u);
      setProxyUrl(u ? `/api/proxy-pdf?u=${encodeURIComponent(u)}` : "");

      if (u && autoOpen && !didAutoRef.current) {
        didAutoRef.current = true;

        // Give the route a beat to mount to avoid races with app/layout effects
        const t = setTimeout(() => {
          try {
            // Prefer same-tab navigation so the pre-opened tab shows the PDF
            window.location.replace(u);
          } catch (e) {
            // If something blocks it, we keep the iframe & button below
            console.warn("Auto-open failed:", e);
          }
        }, 120);

        return () => clearTimeout(t);
      }
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, []);

  const openDirect = React.useCallback(() => {
    if (!directUrl) return;
    const a = document.createElement("a");
    a.href = directUrl;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [directUrl]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 12,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 18, margin: 0 }}>Invoice Viewer</h1>

      {err && <div style={{ color: "#b00" }}>Error: {err}</div>}

      {!directUrl && <div>Missing invoice URL.</div>}

      {directUrl && (
        <>
          <p>
            If your browser didn’t open the PDF automatically, use the options
            below.
          </p>

          {/* Manual open button (direct link, always new tab) */}
          <button
            type="button"
            onClick={openDirect}
            style={{
              display: "inline-block",
              padding: "10px 14px",
              border: "1px solid #333",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Open in new tab (direct)
          </button>

          {/* Inline, same-origin proxy iframe (mobile fallback) */}
          <div
            style={{
              flex: 1,
              border: "1px solid #ddd",
              borderRadius: 8,
              overflow: "hidden",
              minHeight: 200,
            }}
          >
            {proxyUrl ? (
              <iframe
                title="Invoice PDF"
                src={proxyUrl}
                style={{ width: "100%", height: "100%", border: 0 }}
                onError={() => setErr("Failed to load inline viewer")}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div style={{ padding: 12 }}>Preparing viewer…</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
