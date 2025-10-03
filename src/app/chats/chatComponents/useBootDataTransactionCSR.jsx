// useBootData.js
import { useEffect, useMemo, useRef, useState } from "react";

const IP_URL  = "https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo";
const TIME_URL = "https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time";

const LS_IP = "boot_ipInfo_v1";

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const jitter = (base) => base + Math.floor(Math.random() * Math.min(500, base));
const noCacheUrl = (url) => `${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`;

function getNetHints() {
  const nc = typeof navigator !== "undefined" && navigator.connection;
  const slow = ["slow-2g", "2g", "3g"].includes(nc?.effectiveType || "");
  return { slow };
}

async function fetchJSON(url, { timeout = 6000, signal, noStore = false } = {}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeout);

  const composite = new AbortController();
  if (signal) {
    if (signal.aborted) composite.abort();
    else signal.addEventListener("abort", () => composite.abort(), { once: true });
  }
  controller.signal.addEventListener("abort", () => composite.abort(), { once: true });

  try {
    const res = await fetch(noStore ? noCacheUrl(url) : url, {
      signal: composite.signal,
      headers: noStore
        ? { "Accept": "application/json", "Cache-Control": "no-cache", "Pragma": "no-cache" }
        : { "Accept": "application/json" },
      cache: noStore ? "no-store" : "default",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(tid);
  }
}

async function fetchWith1Retry(url, opts) {
  try {
    return await fetchJSON(url, opts);
  } catch {
    await sleep(jitter(200));
    return await fetchJSON(url, opts);
  }
}

export function useBootData() {
  const [ipInfo, setIpInfo] = useState(null);
  const [tokyoTime, setTokyoTime] = useState(null); // UI copy only; time is always fetched fresh when needed
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const inflightRef = useRef(null);
  const abortRef = useRef(null);
  const unmountedRef = useRef(false);
  const setSafe = (setter, v) => { if (!unmountedRef.current) setter(v); };

  // hydrate IP from cache (time is not cached)
  useEffect(() => {
    try {
      const ip = JSON.parse(localStorage.getItem(LS_IP) || "null");
      if (ip) setIpInfo(ip);
    } catch {}
  }, []);

  async function boot(force = false) {
    if (inflightRef.current && !force) return inflightRef.current;
    const { slow } = getNetHints();
    const timeout = slow ? 9000 : 6000;

    const ac = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ac;

    const p = (async () => {
      setSafe(setError, null);
      try {
        const ip = await fetchWith1Retry(IP_URL, { timeout, signal: ac.signal }).catch(() => null);
        if (ip) {
          setSafe(setIpInfo, ip);
          try { localStorage.setItem(LS_IP, JSON.stringify(ip)); } catch {}
        }
        const time = await fetchWith1Retry(TIME_URL, { timeout, signal: ac.signal, noStore: true }).catch(() => null);
        if (time) setSafe(setTokyoTime, time);
      } catch (e) {
        setSafe(setError, e);
      } finally {
        setSafe(setReady, true);
      }
    })();

    inflightRef.current = p;
    try { await p; } finally { inflightRef.current = null; }
  }

  // always fresh time (mandatory for send)
  async function getFreshTime(budgetMs = 3500) {
    const { slow } = getNetHints();
    const timeout = slow ? Math.max(2500, budgetMs) : budgetMs;
    try {
      const fresh = await fetchJSON(TIME_URL, { timeout, noStore: true });
      setSafe(setTokyoTime, fresh);
      return fresh;
    } catch {
      return null;
    }
  }

  // try to fetch fresh IP (best-effort, optional)
  async function getFreshIP(budgetMs = 3000) {
    const { slow } = getNetHints();
    const timeout = slow ? Math.max(2500, budgetMs) : budgetMs;
    try {
      const fresh = await fetchJSON(IP_URL, { timeout });
      setSafe(setIpInfo, fresh);
      try { localStorage.setItem(LS_IP, JSON.stringify(fresh)); } catch {}
      return fresh;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    unmountedRef.current = false;
    boot();
    return () => {
      unmountedRef.current = true;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTokyoLocal = useMemo(() => (ymdHmsMsStr) => {
    if (!ymdHmsMsStr) return "";
    const [datePart, timePart = ""] = ymdHmsMsStr.trim().split(" ");
    const [hh = "00", mm = "00", secMs = "00"] = timePart.split(":");
    const ss = (secMs.split(".")[0] || "00");
    return `${datePart} at ${hh}:${mm}:${ss}`;
  }, []);

  return { ipInfo, tokyoTime, ready, error, getFreshTime, getFreshIP, formatTokyoLocal };
}
