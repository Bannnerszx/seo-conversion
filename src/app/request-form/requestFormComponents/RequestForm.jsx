'use client'
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Car, Sparkles, Shield, FileCheck, Check } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandItem, CommandInput, CommandList, CommandEmpty, CommandGroup } from "@/components/ui/command"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DialogDescription } from "@radix-ui/react-dialog"
const COLORS = [
    // Solid Colors
    { name: "Black", value: "Black", bg: "bg-black", type: "solid" },
    { name: "White", value: "White", bg: "bg-white", type: "solid", border: true },
    { name: "Gray", value: "Gray", bg: "bg-gray-500", type: "solid" },
    { name: "Charcoal", value: "Charcoal", bg: "bg-gray-700", type: "solid" },
    { name: "Red", value: "Red", bg: "bg-red-500", type: "solid" },
    { name: "Maroon", value: "Maroon", bg: "bg-[#800000]", type: "solid" },
    { name: "Burgundy", value: "Burgundy", bg: "bg-[#800020]", type: "solid" },
    { name: "Blue", value: "Blue", bg: "bg-blue-500", type: "solid" },
    { name: "Navy Blue", value: "navy-blue", bg: "bg-blue-900", type: "solid" },
    { name: "Green", value: "Green", bg: "bg-green-500", type: "solid" },
    { name: "Forest Green", value: "forest-green", bg: "bg-green-700", type: "solid" },
    { name: "Yellow", value: "Yellow", bg: "bg-yellow-400", type: "solid" },
    { name: "Brown", value: "Brown", bg: "bg-amber-700", type: "solid" },
    { name: "Orange", value: "Orange", bg: "bg-orange-500", type: "solid" },
    { name: "Purple", value: "Purple", bg: "bg-purple-500", type: "solid" },
    { name: "Beige", value: "Beige", bg: "bg-amber-100", type: "solid", border: true },

    // Metallic Colors
    { name: "Pearl White", value: "Pearl", bg: "bg-gradient-to-br from-white via-blue-50 to-gray-100", type: "metallic", border: true },
    { name: "Silver", value: "Silver", bg: "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400", type: "metallic" },
    { name: "Metallic Silver", value: "Metallic Silver", bg: "bg-gradient-to-br from-gray-300 via-slate-200 to-gray-400", type: "metallic" },
    { name: "Metallic Blue", value: "Metallic Blue", bg: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600", type: "metallic" },
    { name: "Bronze", value: "Bronze", bg: "bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700", type: "metallic" },
    { name: "Gold", value: "Gold", bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600", type: "metallic" },
    { name: "Champagne", value: "Champagne", bg: "bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200", type: "metallic", border: true },

    // Special
    { name: "Others", value: "Others", type: "rainbow", bg: "bg-[conic-gradient(from_0deg_at_center,_#ef4444_0%,_#f87171_8.33%,_#fbbf24_16.67%,_#a3e635_25%,_#22d3ee_33.33%,_#38bdf8_41.67%,_#3b82f6_50%,_#818cf8_58.33%,_#c084fc_66.67%,_#ec4899_75%,_#f472b6_83.33%,_#ef4444_91.67%,_#ef4444_100%)]" }
]

const DEFAULT_NETWORK_TIMEOUT = 15000; // 15s per attempt
const DEFAULT_NETWORK_RETRIES = 2; // number of retries after the first attempt

function callWithTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
    ]);
}

async function retryableCall(fn, arg, options = {}) {
    // allow automatic scaling for slow networks (3g/2g)
    const connection = typeof navigator !== 'undefined' && navigator.connection ? navigator.connection : null;
    const effective = connection && connection.effectiveType ? connection.effectiveType : null;

    // defaults
    let retries = options.retries ?? DEFAULT_NETWORK_RETRIES;
    let timeout = options.timeout ?? DEFAULT_NETWORK_TIMEOUT;
    const backoff = options.backoff ?? 1000;

    if (effective) {
        // increase timeouts and retries on slow connections
        if (effective.includes('3g')) {
            timeout = Math.max(timeout, 30000); // 30s
            retries = Math.max(retries, 3);
        } else if (effective.includes('2g') || effective.includes('slow-2g')) {
            timeout = Math.max(timeout, 60000); // 60s
            retries = Math.max(retries, 4);
        }
        // if downlink / rtt available we could further tune; keep simple for now
    }
    let attempt = 0;
    while (true) {
        try {
            // fn is expected to be a callable (like an httpsCallable result) that returns a Promise
            return await callWithTimeout(fn(arg), timeout);
        } catch (err) {
            attempt++;
            if (attempt > retries) {
                throw err;
            }
            // exponential backoff with tiny jitter
            const delay = backoff * Math.pow(2, attempt - 1) + Math.round(Math.random() * 200);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
}

// Warm-up helper: safely repeat light-weight fetches to prime network connections
async function warmUpNetwork() {
    try {
        const fetchJson = (url) => () => fetch(url).then(r => {
            if (!r.ok) throw new Error('Network response was not ok');
            return r.json();
        });

        // perform two quick fetches spaced out to avoid hammering but to warm DNS/TCP
        await retryableCall(fetchJson("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo"), null).catch(() => { });
        await new Promise((r) => setTimeout(r, 500));
        await retryableCall(fetchJson("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time"), null).catch(() => { });
    } catch (e) {
        // don't escalate: warm-up is best-effort
        // console.debug('Warm-up failed', e);
    }
}
export default function RequestForm({ countryArray, carMakes, accountData }) {
    const [successOpen, setSuccessOpen] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const saveCarRequest = httpsCallable(functions, 'saveCarRequest')
    const REQUIRED = ["make", "model", "year", "priceRangeMin", "priceRangeMax", "country", "port"];
    const isEmpty = (v) => String(v ?? "").trim() === "";
    const formRef = useRef(null);
    const [ipInfo, setIpInfo] = useState(null);
    const [tokyoTime, setTokyoTime] = useState(null);
    const [formData, setFormData] = useState({
        make: "",
        model: "",
        mileageMax: "",
        mileageMin: "",
        priceRangeMin: "",
        priceRangeMax: "",
        year: "",
        fuelType: "",
        driveType: "",
        engineDisplacement: "",
        color: "",
        country: "",
        port: "",
        inspection: false,
        insurance: false
    })
    const showReqError = (name) => submitAttempted && isEmpty(formData[name])


    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }
    useEffect(() => {
        let mounted = true;
        const fetchJson = (url) => () => fetch(url).then(r => {
            if (!r.ok) throw new Error('Network response was not ok');
            return r.json();
        });

        (async () => {
            try {
                const [ip, time] = await Promise.all([
                    retryableCall(fetchJson("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo")),
                    retryableCall(fetchJson("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time")),
                ]);
                if (!mounted) return;
                setIpInfo(ip ?? null);
                setTokyoTime(time ?? null);
            } catch (err) {
                if (!mounted) return;
                console.error("Preload fetch failed", err);
            }
            // best-effort: warm up network afterwards so subsequent heavy requests are more likely to reuse connections
            try { warmUpNetwork(); } catch (e) { }
        })();
        return () => { mounted = false; };
    }, []);


    function formatTokyoLocal(ymdHmsMsStr) {
        if (!ymdHmsMsStr) return '';
        // Match: 2025/10/07 [anything/at] 14:23:45.678
        const m = ymdHmsMsStr.match(
            /(\d{4}\/\d{2}\/\d{2}).*?(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?/
        );
        if (!m) return ymdHmsMsStr; // fallback if unexpected format

        const [, date, hh, mm, ss, msRaw = ''] = m;
        const ms = msRaw ? msRaw.padStart(3, '0').slice(0, 3) : '000';
        return `${date} at ${hh}:${mm}:${ss}.${ms}`;
    }
    // const formatTokyoToMMM_DD_YYYY = (s) => {
    //     if (!s) return null;                    // expects "YYYY/MM/DD HH:mm:ss.SSS"
    //     const [datePart] = String(s).split(/\s+/);
    //     const [yyyy, mm, dd] = datePart.split(/[\/\-]/).map(Number);
    //     if (!yyyy || !mm || !dd) return null;

    //     const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    //     const mon = MONTHS[mm - 1] || "";
    //     return `${mon}-${String(dd).padStart(2, "0")}-${yyyy}`; // e.g., "Oct-24-2025"
    // };
    //country
    const DR_CONGO_LABEL = "D.R. Congo";
    const DR_CONGO_VALUE = "D_R_Congo";

    const slug = (s = "") =>
        s.toString().trim()
            .replace(/[._]/g, " ")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9-]/g, "");

    const fixLabel = (raw = "") => {
        const s = String(raw).trim()
            .replace(/[_]+/g, " ")
            .replace(/\s+/g, " ");

        const drCongos = [
            "D_R_ Congo", "D R Congo", "DR Congo", "D. R. Congo",
            "Democratic Republic of Congo", "Democratic Republic of the Congo",
            "Congo, Democratic Republic", "Congo (DRC)", "DRC"
        ];
        if (drCongos.some(v => v.toLowerCase() === s.toLowerCase())) return DR_CONGO_LABEL;
        return s;
    };

    const normalizeCountryOption = (item) => {
        if (!item) return null;

        let label, code, emoji;
        if (typeof item === "string") {
            label = fixLabel(item);
        } else if (item.label && item.value) {
            label = fixLabel(item.label);
            code = String(item.value);
            emoji = item.emoji;
        } else if (item.name) {
            label = fixLabel(item.name);
            code = item.code || item.alpha2 || item.alpha3;
            emoji = item.emoji;
        } else {
            return null;
        }

        // SPECIAL CASE: D.R. Congo → value must be "D_R_ Congo"
        const value =
            label === DR_CONGO_LABEL
                ? DR_CONGO_VALUE
                : (code != null ? String(code) : slug(label.replace(/\./g, "")));

        return { value, label, emoji };
    };
    // priority list (exact display labels, in order)
    const PRIORITY = [
        "Zambia",
        "Tanzania",
        "Mozambique",
        "Kenya",
        "Uganda",
        "Zimbabwe",
        "D.R. Congo",
    ];

    const raw = Array.isArray(countryArray) ? countryArray : [];
    const optionsDedupMap = new Map();

    // build + dedupe by exact (case-sensitive) value
    raw.map(normalizeCountryOption).filter(Boolean).forEach(opt => {
        if (!optionsDedupMap.has(opt.value)) optionsDedupMap.set(opt.value, opt);
    });

    // ensure all PRIORITY labels exist even if missing in array
    PRIORITY.forEach(lbl => {
        const tmp = normalizeCountryOption(lbl);
        if (tmp && !optionsDedupMap.has(tmp.value)) optionsDedupMap.set(tmp.value, tmp);
    });

    const allOptions = Array.from(optionsDedupMap.values());

    // split into priority (keep given order) + others (A→Z by label, preserving case)
    const priorityOptions = PRIORITY
        .map(lbl => allOptions.find(o => o.label === lbl))
        .filter(Boolean);

    const otherOptions = allOptions
        .filter(o => !PRIORITY.includes(o.label))
        .sort((a, b) => a.label.localeCompare(b.label));

    const countryOptions = [...priorityOptions, ...otherOptions];


    //year
    const CURRENT_YEAR = new Date().getFullYear();
    const YEARS = Array.from({ length: CURRENT_YEAR - 1970 + 1 }, (_, i) => String(CURRENT_YEAR - i));

    const clampYear = (val) => {
        const n = Number(val);
        if (!Number.isFinite(n)) return "";
        if (n < 1970) return "1970";
        if (n > CURRENT_YEAR) return String(CURRENT_YEAR);
        return String(n);
    };

    const [yearOpen, setYearOpen] = useState(false);
    const [yearQuery, setYearQuery] = useState("");

    const selectedYearLabel = formData.year ? String(formData.year) : "";
    const filteredYears = YEARS.filter(y => y.includes(yearQuery.trim()));


    //price
    const onlyDigits = (v = "") => v.replace(/[^\d]/g, "");
    const stripLeadingZeros = (v = "") => v.replace(/^0+(?=\d)/, "");
    const withCommas = (v = "") => v.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // format + keep commas; never force a 0 when empty
    const handleMoneyInput = (field, next) => {
        const raw = stripLeadingZeros(onlyDigits(next));
        const formatted = raw ? withCommas(raw) : "";
        handleInputChange(field, formatted);
    };

    // parse to int; empty -> null
    const toIntOrNull = (s) => {
        const d = stripLeadingZeros(onlyDigits(s ?? ""));
        return d ? parseInt(d, 10) : null;
    };

    // live validation (no wild 0)
    const nMin = toIntOrNull(formData.priceRangeMin);
    const nMax = toIntOrNull(formData.priceRangeMax);
    const priceRangeError = nMin != null && nMax != null && nMin > nMax;



    //ports
    const REQUEST_PORT = "Request port";

    // ports state
    const [ports, setPorts] = useState([]);

    // normalize anything to a string "value" for the Select
    const asPortValue = (p) =>
        p == null
            ? ""
            : typeof p === "string"
                ? p.trim()
                : (p.value ?? p.label ?? String(p)).trim();

    // fetch ports when country changes
    useEffect(() => {
        const getPorts = async () => {
            if (!formData.country) {
                setPorts([]); // Clear ports if no country is selected
                return;
            }
            try {
                const param = encodeURIComponent(formData.country); // safe for "D_R_ Congo"
                const res = await fetch(`/api/ports?ports=${param}`);
                const data = await res.json();

                // Normalize to string array
                const normalized = Array.isArray(data?.ports)
                    ? data.ports.map(asPortValue).filter(Boolean)
                    : [];

                // If no ports for the country, offer "Request port"
                setPorts(normalized.length ? normalized : [REQUEST_PORT]);
            } catch (error) {
                console.error("Error fetching ports:", error);
                // On error, still allow user to pick "Request port"
                setPorts([REQUEST_PORT]);
            }
        };

        getPorts();
    }, [formData.country]);

    // clear port if country cleared OR if current port not in latest list
    useEffect(() => {
        if (!formData.country && formData.port) {
            handleInputChange("port", "");
            return;
        }
        const current = asPortValue(formData.port);
        if (current && ports.length && !ports.includes(current)) {
            handleInputChange("port", "");
        }
        // (Optional) auto-select when only one option
        // if (!formData.port && ports.length === 1) handleInputChange("port", ports[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.country, ports]);

    const isCountrySelected = !!formData.country;
    const selectedPort = ports.includes(asPortValue(formData.port))
        ? asPortValue(formData.port)
        : "";

    //engine displacement
    const handleCcInput = (field, next) => {
        const raw = stripLeadingZeros(onlyDigits(next));
        const formatted = raw ? withCommas(raw) : "";
        handleInputChange(field, formatted);
    };

    // live validation
    const ccMin = toIntOrNull(formData.ccMin);
    const ccMax = toIntOrNull(formData.ccMax);
    const ccError = ccMin != null && ccMax != null && ccMin > ccMax;

    //mileage
    const handleMileageInput = (field, next) => {
        const raw = stripLeadingZeros(onlyDigits(next));
        const formatted = raw ? withCommas(raw) : "";
        handleInputChange(field, formatted);
    };

    // live validation
    const mileageMin = toIntOrNull(formData.mileageMin);
    const mileageMax = toIntOrNull(formData.mileageMax);
    const mileageError = mileageMin != null && mileageMax != null && mileageMin > mileageMax;


    //error red
    const errorClasses = (hasError) =>
        hasError
            ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500 hover:border-red-500"
            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400"



    //handle submit
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitAttempted(true);

        const hasRequiredEmpty = REQUIRED.some((k) => isEmpty(formData[k]));
        const hasAnyError = hasRequiredEmpty || priceRangeError || mileageError || ccError;

        if (hasAnyError) {
            setTimeout(() => {
                const root = formRef.current || document;

                const selectors = [
                    '#make[aria-invalid="true"]',
                    '#model[aria-invalid="true"]',
                    '#year[aria-invalid="true"]',
                    '#priceRangeMin[aria-invalid="true"]',
                    '#priceRangeMax[aria-invalid="true"]',
                    '#country[aria-invalid="true"]',
                    '#port[aria-invalid="true"]',
                    '[aria-invalid="true"]'
                ];

                const target =
                    selectors.map(sel => root.querySelector(sel)).find(Boolean) ||
                    root.querySelector('[aria-invalid="true"]');

                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                    if (typeof target.focus === 'function') target.focus({ preventScroll: true })
                }
            }, 0)
            return;
        }

        setSubmitting(true);
        const submissionId = crypto.randomUUID();
        let currentIpInfo = ipInfo;
        let currentTokyoTime = tokyoTime;
        try {

            // If the client reports a slow connection, try a warm up to prime TCP/DNS before heavy upload
            const connection = typeof navigator !== 'undefined' && navigator.connection ? navigator.connection : null;
            const effective = connection && connection.effectiveType ? connection.effectiveType : null;
            if (effective && (effective.includes('3g') || effective.includes('2g'))) {
                // warm network quickly but don't block send for too long
                warmUpNetwork().catch(() => { });
            }
            const fetchJson = (url) => () => fetch(url).then(r => {
                if (!r.ok) throw new Error('Network response was not ok');
                return r.json();
            });

            const [freshIp, freshTime] = await Promise.all([
                retryableCall(fetchJson("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo")),
                retryableCall(fetchJson("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time")),
            ]);
            currentIpInfo = freshIp;
            currentTokyoTime = freshTime;

            // Update state with fresh data for next time
            setIpInfo(freshIp);
            setTokyoTime(freshTime);

            if (!currentTokyoTime?.datetime) {
                throw new Error("Could not get Tokyo time. Please try again.")
            }

            const payload = {
                ...formData,
                datetime: formatTokyoLocal(currentTokyoTime.datetime),
                ipInfo: currentIpInfo,
                userAgent: navigator.userAgent,
                requestedBy: accountData.textEmail,
                submissionId: submissionId
            };

            const result = await saveCarRequest(payload);
            setSubmitAttempted(false);
            setSuccessOpen(true);
        } catch (fetchError) {
            console.warn("Failed to fetch fresh data, using cached values:", fetchError);
            setSubmitError(fetchError.message || "An unknown error occured. Please try again.");
        } finally {
            setSubmitting(false)
        }
        // console.log("Form submitted:", formData, ipInfo, formatTokyoToMMM_DD_YYYY(tokyoTime?.datetime))
    }
    return (
        <div className="min-h-screen px-4 py-8 md:py-12">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="mb-6 inline-flex items-center gap-3 rounded-md bg-[#0000ff] p-1 shadow-lg">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl">
                            <Car className="h-7 w-7 text-white" />
                        </div>
                        <div className="pr-4">
                            <h1 className="text-3xl font-bold text-white md:text-4xl">Vehicle Request</h1>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Find your perfect vehicle. Fill in the details below and we'll help you get the best match.
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    {/* Essential Details Card */}
                    <div className="animate-scale-in rounded-md bg-white shadow-xl transition-all hover:shadow-2xl">
                        <div className="border-b border-blue-100 bg-[#0000ff] p-5 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Essential Details</h2>
                            </div>
                        </div>

                        <div className="space-y-5 p-6 md:p-8">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="make" className="text-sm font-semibold text-gray-900">
                                        Make <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.make || ""}
                                        onValueChange={(value) => handleInputChange("make", value)}

                                    >
                                        <SelectTrigger
                                            id="make"
                                            aria-invalid={showReqError("make") ? "true" : "false"}
                                            aria-disabled={!isCountrySelected}
                                            className={`h-12 bg-white transition-all border-2 ${errorClasses(showReqError("make"))}`}
                                        >
                                            <SelectValue
                                                placeholder="Select Make"
                                            />
                                        </SelectTrigger>

                                        <SelectContent className="max-h-[300px] bg-white">
                                            {carMakes?.length ? (
                                                carMakes.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>
                                                        <span className="inline-flex items-center gap-2">{opt}</span>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-3 text-sm text-gray-500">No maker available</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model" className="text-sm font-semibold text-gray-900">
                                        Model <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="model"
                                        aria-invalid={showReqError("model") ? "true" : "false"}
                                        placeholder="e.g., Camry, Accord"
                                        value={(formData.model ?? "").toUpperCase()}
                                        onChange={(e) => handleInputChange("model", e.target.value.toUpperCase())}
                                        className={`h-12 bg-white transition-all border-2 ${errorClasses(showReqError("model"))}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="year" className="text-sm font-semibold text-gray-900">
                                        Year <span className="text-red-500">*</span>
                                    </Label>

                                    {/* Trigger */}
                                    <Popover open={yearOpen} onOpenChange={setYearOpen}>
                                        <PopoverTrigger asChild>
                                            <button
                                                id="year"
                                                type="button"
                                                aria-invalid={showReqError("year") ? "true" : "false"}
                                                aria-haspopup="listbox"
                                                aria-expanded={yearOpen}
                                                className={`flex h-12 w-full items-center justify-between rounded-md bg-white px-3 text-left text-sm transition-all border-2 ${errorClasses(showReqError("year"))}`}
                                            >
                                                <span className={selectedYearLabel ? "text-gray-900" : "text-gray-400"}>
                                                    {selectedYearLabel || `Year`}
                                                </span>
                                                {/* caret icon (inline, no import) */}
                                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </PopoverTrigger>

                                        {/* Content */}
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <div className="px-2 pt-2">
                                                    <CommandInput
                                                        value={yearQuery}
                                                        onValueChange={setYearQuery}
                                                        placeholder={`Type a year (1970–${CURRENT_YEAR})`}
                                                        className="h-10"
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                const clamped = clampYear(yearQuery);
                                                                if (clamped) {
                                                                    handleInputChange("year", clamped);
                                                                    setYearOpen(false);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <CommandList className="max-h-60 overflow-auto">
                                                    <CommandEmpty className="p-3 text-sm text-gray-500">
                                                        No matches. Try between 1970 and {CURRENT_YEAR}.
                                                    </CommandEmpty>

                                                    <CommandGroup heading="Select year">
                                                        {(filteredYears.length ? filteredYears : YEARS).map((y) => {
                                                            const isSelected = String(formData.year) === y;
                                                            return (
                                                                <CommandItem
                                                                    key={y}
                                                                    value={y}
                                                                    onSelect={() => {
                                                                        handleInputChange("year", y);
                                                                        setYearQuery("");
                                                                        setYearOpen(false);
                                                                    }}
                                                                    className="flex items-center justify-between"
                                                                >
                                                                    <span>{y}</span>
                                                                    {/* check icon (inline) */}
                                                                    {isSelected && (
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                                                            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                        </svg>
                                                                    )}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Keep data clean even if user types directly in input via Enter */}
                                    <input
                                        type="hidden"
                                        name="year"
                                        value={formData.year ?? ""}
                                        onChange={() => { }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-900">
                                        Price Range (USD) <span className="text-red-500">*</span>
                                    </Label>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Min */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">$</span>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Min"
                                                value={formData.priceRangeMin ?? ""}
                                                onChange={(e) => handleMoneyInput("priceRangeMin", e.target.value)}
                                                aria-label="Minimum price in USD"
                                                aria-invalid={(priceRangeError || showReqError("priceRangeMin")) ? "true" : "false"}
                                                className={`h-12 bg-white pl-7 transition-all border-2 ${errorClasses(priceRangeError || showReqError("priceRangeMin"))}`}
                                            />
                                        </div>

                                        {/* Max */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">$</span>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Max"
                                                value={formData.priceRangeMax ?? ""}
                                                onChange={(e) => handleMoneyInput("priceRangeMax", e.target.value)}
                                                aria-label="Maximum price in USD"
                                                aria-invalid={(priceRangeError || showReqError("priceRangeMax")) ? "true" : "false"}
                                                className={`h-12 bg-white pl-7 transition-all border-2 ${errorClasses(priceRangeError || showReqError("priceRangeMax"))}`}
                                            />
                                        </div>
                                    </div>

                                    {priceRangeError && (
                                        <p role="alert" className="text-xs font-medium text-red-600">
                                            Minimum price cannot be greater than maximum price.
                                        </p>
                                    )}
                                </div>




                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-sm font-semibold text-gray-900">
                                        Country <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.country || ""}
                                        onValueChange={(value) => {
                                            if (value !== formData.country) {
                                                handleInputChange("port", ""); // reset selected port
                                                setPorts([]);                  // optional: clear list until fetch loads
                                            }
                                            handleInputChange("country", value);
                                        }}
                                    >
                                        <SelectTrigger
                                            id="country"
                                            aria-invalid={showReqError("country") ? "true" : "false"}
                                            className={`h-12 bg-white transition-all border-2 ${errorClasses(showReqError("country"))}`}
                                        >
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>

                                        <SelectContent className="max-h-[300px] bg-white">
                                            {countryOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <span className="inline-flex items-center gap-2">
                                                        {opt.emoji ? <span aria-hidden>{opt.emoji}</span> : null}
                                                        {opt.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="port" className="text-sm font-semibold text-gray-900">
                                        Port <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.port || ""}
                                        onValueChange={(value) => handleInputChange("port", value)}
                                        disabled={!isCountrySelected}
                                    >
                                        <SelectTrigger
                                            id="port"
                                            aria-invalid={showReqError("port") ? "true" : "false"}
                                            aria-disabled={!isCountrySelected}
                                            className={`h-12 transition-all border-2 ${!isCountrySelected
                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                : `bg-white ${errorClasses(showReqError("port"))}`
                                                }`}
                                        >
                                            <SelectValue
                                                placeholder={isCountrySelected ? "Select port" : "Select port"}
                                            />
                                        </SelectTrigger>

                                        <SelectContent className="max-h-[300px] bg-white">
                                            {ports.length ? (
                                                ports.map((val) => (
                                                    <SelectItem key={val} value={val}>
                                                        <span className="inline-flex items-center gap-2">{val}</span>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-3 text-sm text-gray-500">No ports available</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>


                            </div>
                        </div>
                    </div>

                    {/* Additional Specifications Card */}
                    <div className="animate-scale-in rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl">
                        <div className="border-b border-gray-200 p-5">
                            <h2 className="text-xl font-bold text-gray-900">Additional Specifications</h2>
                            <p className="text-sm text-gray-600">Optional details to refine your search</p>
                        </div>

                        <div className="space-y-5 p-6 md:p-8">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-900">Mileage (km)</Label>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Min mileage */}
                                        <div className="relative">
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                                                km
                                            </span>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Min"
                                                value={formData.mileageMin ?? ""}
                                                onChange={(e) => handleMileageInput("mileageMin", e.target.value)}
                                                aria-label="Minimum mileage in km"
                                                aria-invalid={mileageError ? "true" : "false"}
                                                className={[
                                                    "h-12 bg-white pr-9 transition-all",
                                                    "border-2 hover:border-blue-400 focus:border-blue-500",
                                                    mileageError ? "border-red-500 focus:border-red-500 hover:border-red-500" : "border-gray-200",
                                                ].join(" ")}
                                            />
                                        </div>

                                        {/* Max mileage */}
                                        <div className="relative">
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                                                km
                                            </span>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Max"
                                                value={formData.mileageMax ?? ""}
                                                onChange={(e) => handleMileageInput("mileageMax", e.target.value)}
                                                aria-label="Maximum mileage in km"
                                                aria-invalid={mileageError ? "true" : "false"}
                                                className={[
                                                    "h-12 bg-white pr-9 transition-all",
                                                    "border-2 hover:border-blue-400 focus:border-blue-500",
                                                    mileageError ? "border-red-500 focus:border-red-500 hover:border-red-500" : "border-gray-200",
                                                ].join(" ")}
                                            />
                                        </div>
                                    </div>

                                    {mileageError && (
                                        <p role="alert" className="text-xs font-medium text-red-600">
                                            Minimum mileage cannot be greater than maximum mileage.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fuelType" className="text-sm font-medium text-gray-700">
                                        Fuel Type
                                    </Label>
                                    <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                                        <SelectTrigger id="fuelType" className="h-12 border-gray-200 bg-white transition-all hover:border-blue-400">
                                            <SelectValue placeholder="Select fuel type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="Gasoline">Gasoline</SelectItem>
                                            <SelectItem value="Diesel">Diesel</SelectItem>
                                            <SelectItem value="Electric">Electric</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            <SelectItem value="CNG">CNG</SelectItem>
                                            <SelectItem value="Ethanol-FFV">Ethanol-FFV</SelectItem>
                                            <SelectItem value="Gasoline/Petrol">Gasoline/Petrol</SelectItem>
                                            <SelectItem value="LPG">LPG</SelectItem>
                                            <SelectItem value="Steam">Steam</SelectItem>
                                            <SelectItem value="Rotary">Rotary</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="driveType" className="text-sm font-medium text-gray-700">
                                        Drive Type
                                    </Label>
                                    <Select value={formData.driveType} onValueChange={(value) => handleInputChange("driveType", value)}>
                                        <SelectTrigger id="driveType" className="h-12 border-gray-200 bg-white transition-all hover:border-blue-400">
                                            <SelectValue placeholder="Select drive type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="2-wheel Drive">2-Wheel Drive</SelectItem>
                                            <SelectItem value="4-wheel Drive">4-Wheel Drive</SelectItem>
                                            <SelectItem value="All-wheel Drive">All-Wheel Drive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-900">
                                        Engine Displacement (cc)
                                    </Label>

                                    <div className="gap-3">
                                        {/* Min CC */}
                                        <div className="relative">
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                                                cc
                                            </span>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Min"
                                                value={formData.engineDisplacement ?? ""}
                                                onChange={(e) => handleCcInput("engineDisplacement", e.target.value)}
                                                aria-label="Minimum engine displacement in cc"
                                                aria-invalid={ccError ? "true" : "false"}
                                                className={"h-12 bg-white pr-9 transition-all border-gray-200 border-2 hover:border-blue-400 focus:border-blue-500"}


                                            />
                                        </div>


                                    </div>

                                    {ccError && (
                                        <p role="alert" className="text-xs font-medium text-red-600">
                                            Minimum cc cannot be greater than maximum cc.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div className="space-y-3 pt-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Preferred Color</Label>
                                    <p className="text-xs text-gray-500">Choose your preferred vehicle color</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                                    {COLORS.map((color) => {
                                        const isSelected = formData.color === color.value;
                                        return (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => handleInputChange("color", color.value)}
                                                aria-pressed={isSelected}
                                                className="group flex flex-col items-center gap-1.5 focus:outline-none"
                                                title={color.name}
                                            >
                                                <div
                                                    className={[
                                                        // comfy on mobile; slightly smaller on wide screens to fit 12 across
                                                        "relative h-12 w-12 xl:h-10 xl:w-10 rounded-full overflow-hidden shadow-sm ring-offset-2 transition-all",
                                                        "hover:scale-105 hover:shadow-md",
                                                        color.bg,
                                                        color.border ? "border-2 border-gray-300" : "",
                                                        isSelected ? "ring-2 ring-blue-500 scale-110" : "",
                                                    ].join(" ")}
                                                >
                                                    {color.effect === "metallic" && (
                                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div
                                                                className={[
                                                                    "h-3 w-3 rounded-full shadow-sm",
                                                                    ["White", "Beige", "Yellow", "Pearl", "Champagne"].includes(color.value)
                                                                        ? "bg-gray-800"
                                                                        : "bg-white",
                                                                ].join(" ")}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="max-w-[70px] text-center text-[10px] leading-tight text-gray-600 group-hover:text-gray-900">
                                                    {color.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                            </div>

                        </div>
                    </div>

                    {/* Additional Services Card */}
                    <div className="animate-scale-in rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl">
                        <div className="border-b border-gray-200 p-5">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-blue-600" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Additional Services</h2>
                                    <p className="text-sm text-gray-600">Protect your investment</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 p-6 md:p-8">
                            <div className="group rounded-xl border-2 border-gray-200 bg-blue-50/40 p-5 transition-all hover:border-blue-400 hover:bg-blue-50">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        id="inspection"
                                        checked={formData.inspection}
                                        onCheckedChange={(checked) => handleInputChange("inspection", checked)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor="inspection" className="flex items-center gap-2 text-base font-semibold cursor-pointer text-gray-900">
                                            <FileCheck className="h-4 w-4 text-blue-600" />
                                            Inspection
                                        </Label>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Get an inspection for this unit.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group rounded-xl border-2 border-gray-200 bg-blue-50/40 p-5 transition-all hover:border-blue-400 hover:bg-blue-50">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        id="insurance"
                                        checked={formData.insurance}
                                        onCheckedChange={(checked) => handleInputChange("insurance", checked)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor="insurance" className="flex items-center gap-2 text-base font-semibold cursor-pointer text-gray-900">
                                            <Shield className="h-4 w-4 text-blue-600" />
                                            Insurance
                                        </Label>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Get an insurance for this unit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                        <DialogContent className="sm:max-w-lg border-0 p-0 overflow-hidden bg-white">

                            {/* Decorative background elements */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                            </div>

                            <div className="relative p-8 sm:p-10">
                                <DialogHeader>
                                    {/* Title (icon + text) */}
                                    <DialogTitle asChild>
                                        <div className="flex flex-col items-center gap-4 mb-2">
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full blur-xl animate-pulse" />
                                                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-500">
                                                    <Check aria-hidden="true" className="w-10 h-10 text-white stroke-[3]" />
                                                </div>
                                            </div>
                                            <span className="text-3xl font-bold tracking-tight">Request Submitted</span>
                                        </div>
                                    </DialogTitle>

                                    {/* Description MUST be a single paragraph (no nested divs/p) */}
                                    <DialogDescription className="text-center text-base text-slate-500/70 leading-relaxed max-w-sm mx-auto">
                                        Your vehicle request has been sent successfully. Our team will contact you shortly to discuss the details.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Action buttons (outside DialogDescription) */}
                                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setSuccessOpen(false); setFormData({}); }}
                                        className="
            flex-1 inline-flex items-center justify-center
            rounded-lg
            border-2 border-blue-600 bg-blue-600
            px-6 py-3 text-sm font-semibold text-white
            transition-colors
            hover:bg-blue-700 hover:border-blue-700
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
            active:bg-blue-800 active:border-blue-800
          "
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>


                    {/* Submit Button */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={submitting}
                            className="h-14 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-base font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] hover:from-blue-700 hover:to-blue-600"
                        >
                            {submitting ? "Submitting..." : "Submit Vehicle Request"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
