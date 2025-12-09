'use client'
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useCustomChat } from "./useCustomChat"
import TransactionCSR from "./TransactionCSR"
import TransactionList from "./TransactionListCSR"
import { getFirebaseFirestore } from "../../../../firebase/clientApp"
import { getVehicleStatusByChatId, loadMoreMessages } from "@/app/actions/actions"
import { SortProvider } from "@/app/stock/stockComponents/sortContext"
import TransactionCSRLoader from "./TransactionCSRLoader"
import { getVehicleStatuses } from "@/app/actions/actions"
import { format } from "date-fns"

const PAGE_SIZE = 12
const PAGE_LIMIT = PAGE_SIZE + 1
let lastVisible = null;

// --- Lowercase variants for search ---
function buildDashVariantsLower(token) {
    // normalize then force lower
    const base = normalizeStrict(token).toLowerCase();
    const dashes = ["-", "\u2013", "\u2212", "\uFF0D"]; // hyphen, en dash, minus, full-width
    const set = new Set([base]);

    if (!base.includes("-")) {
        return Array.from(set).slice(0, 10);
    }
    for (const d of dashes) {
        set.add(base.replace(/-/g, d)); // keep all-lowercase
    }
    return Array.from(set).slice(0, 10);
}

function cleanManyLower(arr) {
    if (!Array.isArray(arr)) return [];
    const cleaned = arr
        .map((s) => normalizeStrict(s).toLowerCase())
        .filter(Boolean);
    return Array.from(new Set(cleaned)).slice(0, 10);
}
function normalizeStrict(raw) {
    // NFKC, remove format/bidi marks, unify ANY dash to '-', trim
    return String(raw ?? "")
        .normalize("NFKC")
        .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u2060\uFEFF\u00A0]/g, "")
        .replace(/\p{Pd}/gu, "-")
        .trim()
}

function buildDashVariants(token) {
    const base = normalizeStrict(token)
    const dashes = ["-", "\u2013", "\u2212", "\uFF0D"]

    const basicSet = new Set([base, base.toUpperCase(), base.toLowerCase()])

    if (!base.includes("-")) {
        return Array.from(basicSet).slice(0, 10)
    }

    for (const d of dashes) {
        const v = base.replace(/-/g, d)
        basicSet.add(v)
        basicSet.add(v.toUpperCase())
        basicSet.add(v.toLowerCase())
    }
    return Array.from(basicSet).slice(0, 10)
}


function cleanMany(arr) {
    if (!Array.isArray(arr)) return []
    const cleaned = arr.map(normalizeStrict).filter(Boolean)
    return Array.from(new Set(cleaned)).slice(0, 10)
}


export function subscribeToChatList(
    userEmail,
    keywordArrayOrCallback = [],
    callbackOptional
) {
    if (!userEmail) return () => { }

    const isFn = typeof keywordArrayOrCallback === "function"
    let keywords = []
    if (!isFn) {
        if (Array.isArray(keywordArrayOrCallback)) keywords = keywordArrayOrCallback
        else if (typeof keywordArrayOrCallback === "string") {
            const s = keywordArrayOrCallback.trim()
            if (s) keywords = [s]
        }
    }
    const callback = isFn ? keywordArrayOrCallback : callbackOptional

    // 3. Changed: Async initialization pattern
    let unsubscribe = null;
    let isCancelled = false;

    const init = async () => {
        try {
            const [firestore, { collection, query, where, orderBy, limit, onSnapshot }] = await Promise.all([
                getFirebaseFirestore(),
                import("firebase/firestore")
            ]);

            if (isCancelled) return;

            const constraints = [where("participants.customer", "==", userEmail)]
            if (keywords.length > 0) constraints.push(where("keywords", "array-contains-any", keywords))

            constraints.push(orderBy("lastMessageDate", "desc"), limit(PAGE_LIMIT))
            const qy = query(collection(firestore, "chats"), ...constraints)

            unsubscribe = onSnapshot(
                qy,
                (snapshot) => {
                    const docs = snapshot.docs
                    const hasMore = docs.length > PAGE_SIZE

                    const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs
                    const chatList = pageDocs.map(d => ({ id: d.id, ...d.data() }))

                    const cursor = pageDocs.length ? pageDocs[pageDocs.length - 1] : null

                    if (typeof callback === 'function') {
                        callback(chatList, {
                            hasMore,
                            cursor,
                            filtered: keywords.length > 0,
                            usedValues: keywords
                        })
                    }
                },
                (err) => console.error("Error fetching chat list:", err)
            )
        } catch (err) {
            console.error("Failed to subscribe to chat list:", err);
        }
    }

    init();

    return () => {
        isCancelled = true;
        if (unsubscribe) unsubscribe();
    }
}

const subscribeToMessages = (id, callback) => {
    if (!id) {
        return () => { } 
    }

    let unsubscribe = null;
    let isCancelled = false;

    const init = async () => {
        try {
            const [firestore, { collection, query, orderBy, limit, onSnapshot }] = await Promise.all([
                getFirebaseFirestore(),
                import("firebase/firestore")
            ]);

            if (isCancelled) return;

            const messagesRef = collection(firestore, "chats", id, "messages")
            const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(15))

            unsubscribe = onSnapshot(
                messagesQuery,
                (querySnapshot) => {
                    const messages = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp ? doc.data().timestamp.toString() : null,
                    }))
                    callback(messages)
                },
                (error) => {
                    console.error("Error fetching messages: ", error)
                },
            )
        } catch (err) {
            console.error("Failed to subscribe to messages:", err);
        }
    }

    init();

    return () => {
        isCancelled = true;
        if (unsubscribe) unsubscribe();
    }
}

export function subscribeToInvoiceData(invoiceNumber, callback) {
    if (!invoiceNumber) {
        return () => { }
    }

    let unsubscribe = null;
    let isCancelled = false;

    const init = async () => {
        console.time("invoiceLoadTime")
        try {
            const [firestore, { doc, onSnapshot }] = await Promise.all([
                getFirebaseFirestore(),
                import("firebase/firestore")
            ]);

            if (isCancelled) return;

            const invoiceDocRef = doc(firestore, "IssuedInvoice", invoiceNumber)

            unsubscribe = onSnapshot(invoiceDocRef, (docSnapshot) => {
                try {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data()
                        let formattedDate = "No due date available"

                        const dueDate = data?.bankInformations?.dueDate
                        if (dueDate) {
                            formattedDate = format(new Date(dueDate), "MMMM dd, yyyy");
                        }

                        callback({ invoiceData: data, formattedDate })
                    } else {
                        console.log("No such invoice document!")
                        callback({ invoiceData: null, formattedDate: "No due date available" })
                    }
                } catch (error) {
                    console.error("Error fetching data:", error)
                    callback({ invoiceData: null, formattedDate: "Error fetching due date" })
                }
            })
        } catch (err) {
            console.error("Failed to subscribe to invoice:", err);
        }
    }

    init();

    return () => {
        isCancelled = true;
        if (unsubscribe) unsubscribe();
    }
};

export async function loadMoreChatList(userEmail, { cursor, keywords = [] } = {}) {
    if (!userEmail || !cursor) {
        return { items: [], hasMore: false, cursor: null }
    }

    // 4. Changed: Async loading for loadMore
    const [firestore, { collection, query, where, orderBy, startAfter, limit, getDocs }] = await Promise.all([
        getFirebaseFirestore(),
        import("firebase/firestore")
    ]);

    const constraints = [
        where('participants.customer', '==', userEmail),
        ...(Array.isArray(keywords) && keywords.length > 0
            ? [where('keywords', 'array-contains-any', keywords)]
            : []),
        orderBy('lastMessageDate', 'desc'),
        startAfter(cursor),
        limit(PAGE_LIMIT + 1), 
    ];
    if (Array.isArray(keywords) && keywords.length > 0) {
        constraints.push(where("keywords", "array-contains-any", keywords))
    }


    const qy = query(collection(firestore, 'chats'), ...constraints);
    const snap = await getDocs(qy);

    const hasMore = snap.size > PAGE_LIMIT;
    const pageDocs = hasMore ? snap.docs.slice(0, PAGE_LIMIT) : snap.docs;
    const items = pageDocs.map(d => ({ id: d.id, ...d.data() }));
    const nextCursor = pageDocs.length ? pageDocs[pageDocs.length - 1] : null;

    return { items, hasMore, cursor: nextCursor };
}

export async function makeTrueRead(chatId) {
    try {
        // 5. Changed: Async loading for update
        const [firestore, { doc, updateDoc }] = await Promise.all([
            getFirebaseFirestore(),
            import("firebase/firestore")
        ]);
        const chatRef = doc(firestore, "chats", chatId);
        await updateDoc(chatRef, { customerRead: true });
    } catch (error) {
        console.error("Error marking read:", error);
    }
};

const tsKey = (ts) => {
    if (!ts) return "";
    if (typeof ts?.toMillis === "function") {
        // Firestore Timestamp
        return String(ts.toMillis()).padStart(13, "0"); // ms since epoch
    }
    // string like "2025/08/10 at 18:01:15.892" (ms optional)
    return String(ts)
        .trim()
        .replace(" at ", " ")
        .replace(/[^\d]/g, "")     // -> YYYYMMDDHHmmssSSS
        .padEnd(17, "0");          // normalize when .SSS missing
};
export default function ChatPageCSR({ accountData, userEmail, currency, fetchInvoiceData, countryList, prefetchedData }) {
    const [chatList, setChatList] = useState(prefetchedData?.map(chat => ({ id: chat.id, ...chat })) || [])
    const [selectedContact, setSelectedContact] = useState(prefetchedData?.[0] || null)

    const [searchQuery, setSearchQuery] = useState("")
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [pageCursor, setPageCursor] = useState(null)          

    const [vehicleStatuses, setVehicleStatuses] = useState([]);
    const [loadingBooking, setLoadingBooking] = useState(false)
    const [bookingData, setBookingData] = useState({})
    const router = useRouter()
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)

    const { messages, sendMessage, isLoading } = useCustomChat(selectedContact?.id)
    const [chatId, setChatId] = useState("")
    const [chatMessages, setChatMessages] = useState([])
    const [invoiceData, setInvoiceData] = useState({})
    const [lastTimestamp, setLastTimestamp] = useState("")
    const [isMobileView, setIsMobileView] = useState(false)
    const [isLoadingTransaction, setIsLoadingTransaction] = useState(true)
    const [isSurveyOpen, setIsSurveyOpen] = useState(true)


    // mobile check
    useEffect(() => {
        const checkMobileView = () => setIsMobileView(window.innerWidth <= 768)
        checkMobileView()
        window.addEventListener("resize", checkMobileView)
        return () => window.removeEventListener("resize", checkMobileView)
    }, [])

    // Messages: prefill + live subscription
    useEffect(() => {
        if (!chatId) {
            console.warn("chatId is not set. Messages cannot be fetched or scrolled.")
            return
        }

        // 1) prefill
        if (Array.isArray(prefetchedData) && prefetchedData.length) {
            const match = prefetchedData.find(c => c.id === chatId || c.chatId === chatId) || null
            if (match) {
                const pre = Array.isArray(match.messages) ? match.messages : []
                if (pre.length) {
                    const preAsc = [...pre].sort((a, b) => tsKey(a.timestamp).localeCompare(tsKey(b.timestamp)))
                    setChatMessages(preAsc)
                    setLastTimestamp(preAsc[0]?.timestamp ?? null) // oldest for "load older"
                }
            }
        }

        // 2) live subscription
        const unsubscribe = subscribeToMessages(chatId, (msgs) => {
            setChatMessages(prev => {
                const keyOf = (m) => m.id ?? m.messageId ?? `${tsKey(m.timestamp)}_${m.senderId ?? ""}_${m.text ?? ""}`
                const map = new Map()
                for (const m of prev) map.set(keyOf(m), m)
                if (Array.isArray(msgs)) for (const m of msgs) map.set(keyOf(m), m)

                const mergedAsc = Array.from(map.values()).sort((a, b) => tsKey(a.timestamp).localeCompare(tsKey(b.timestamp)))
                const oldest = mergedAsc[0]?.timestamp ?? null
                setLastTimestamp(oldest)
                return mergedAsc
            })
        })

        return () => unsubscribe()
    }, [chatId, prefetchedData])

    // invoice sub
    useEffect(() => {
        const unsubscribe = subscribeToInvoiceData(selectedContact?.invoiceNumber, (msgs) => {
            setInvoiceData(msgs)
        })
        return () => unsubscribe()
    }, [selectedContact?.invoiceNumber, chatId])

    // derive chatId from pathname, guard ownership
    useEffect(() => {
        const segments = pathname.split("/").filter(Boolean)
        if (segments.length === 1 && segments[0] === "chats") return

        const section = segments[1]
        const chatIdFromPath =
            section === "ordered" || section === "payment"
                ? segments[2]
                : section

        if (!chatIdFromPath) {
            router.replace("/chats")
            return
        }

        const m = chatIdFromPath.match(/^chat[_-]?\d+[_-]?(.+)$/)
        if (!m) {
            router.replace("/chats")
            return
        }

        const rawEmail = m[1]
        const emailFromChatId = rawEmail.includes("%") ? decodeURIComponent(rawEmail) : rawEmail

        if (emailFromChatId !== userEmail) {
            router.replace("/chats")
        } else {
            setChatId(chatIdFromPath)
        }
    }, [pathname, userEmail, router])

    const handleSelectContact = async (contact) => {
        router.push(`/chats/${contact.id}`)
        if (contact.id === chatId) return

        setIsLoadingTransaction(true)
        setInvoiceData({})
        setSelectedContact(null)
        setChatMessages([])
        setLastTimestamp(null)
        setBookingData({})

        const prefetchedContact = (prefetchedData || []).find(item => item.id === contact.id)
        if (prefetchedContact) setSelectedContact(prefetchedContact)
    }

    // loading state toggle when route changes
    useEffect(() => {
        if (isLoadingTransaction) setIsLoadingTransaction(false)
    }, [pathname, isLoadingTransaction])

    const handleBackToList = () => {
        router.push({
            pathname: "/chats",
            query: { prefetchedData: JSON.stringify(prefetchedData) },
        })
    }

    const [loadMain, setLoadMain] = useState(true)
    useEffect(() => {
        if (chatList && chatList.length > 0) {
            const selectedChat = chatList.find((chat) => chat.id === chatId)
            if (selectedChat) {
                setSelectedContact(selectedChat)
                setLoadMain(false)
            }
        }
    }, [chatId, chatList])

    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const keyOf = (m) => m.id ?? m.messageId ?? `${tsKey(m.timestamp)}_${m.senderId ?? ""}_${m.text ?? ""}`

    // MESSAGE "load older" (unchanged logic)
    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMore) return
        if (!chatId || !lastTimestamp) return

        setIsLoadingMore(true)
        try {
            const older = await loadMoreMessages(chatId, lastTimestamp)
            if (!older || older.length === 0) {
                setHasMore(false)
                return
            }

            setChatMessages((prev) => {
                const map = new Map()
                for (const m of older) map.set(keyOf(m), m)
                for (const m of prev) map.set(keyOf(m), m)

                const mergedAsc = Array.from(map.values()).sort((a, b) =>
                    tsKey(a.timestamp).localeCompare(tsKey(b.timestamp))
                )
                const newOldest = mergedAsc[0]?.timestamp ?? null
                setLastTimestamp(newOldest)
                return mergedAsc
            })
        } catch (error) {
            console.error("Error loading more messages:", error)
        } finally {
            setIsLoadingMore(false)
        }
    }

    // 🔁 CHAT LIST: subscribe (first page) and reset paging on search change
    useEffect(() => {
        if (!userEmail) return;
        const trimmedQuery = (searchQuery || "").trim();

        setHasMore(true);
        setPageCursor(null);
        if (trimmedQuery) {
            setChatList([]);
        }


        const keywords =
            trimmedQuery
                ? (trimmedQuery.includes("-"))
                    ? buildDashVariantsLower(trimmedQuery)
                    : cleanManyLower([trimmedQuery])
                : [];

        // Smooth handoff: merge once on the very first realtime tick
        const firstTick = { current: true };
        const unsubscribe = subscribeToChatList(userEmail, keywords, (newChatList, meta) => {
            setHasMore(Boolean(meta?.hasMore));
            setPageCursor(meta?.cursor ?? null);
            setChatList(
                prev => {
                    if (!keywords.length > 0) return newChatList;
                    if (firstTick.current) {
                        firstTick.current = false;
                        const byId = new Map(prev.map(i => [i.id, i]));
                        return newChatList.map(n => ({ ...byId.get(n.id), ...n }));
                    }
                    return newChatList;
                });
        });

        return () => unsubscribe();
    }, [userEmail, searchQuery])


    //vehicle status
    useEffect(() => {
        const ids = (chatList || []).map(c => c?.carData?.stockID).filter(Boolean);
        if (ids.length === 0) return;

        let cancelled = false;

        (async () => {
            const map = await getVehicleStatuses(ids);  // { [id]: { reservedTo, stockStatus } }
            if (cancelled) return;

            // Turn map → array of rows we fetched this time
            const incoming = Object.entries(map).map(([id, v]) => ({ id, ...v }));

            // ✅ Merge (upsert) into existing array, keyed by id
            setVehicleStatuses(prev => {
                const byId = new Map(prev.map(x => [x.id, x]));
                for (const row of incoming) {
                    const existing = byId.get(row.id) || {};
                    byId.set(row.id, { ...existing, ...row });
                }
                return Array.from(byId.values());
            });
        })();

        return () => { cancelled = true; };
    }, [chatList]);
    useEffect(() => {
        if (!selectedContact?.id) return;
        let cancelled = false;

        (async () => {
            const map = await getVehicleStatusByChatId(selectedContact?.id);
            if (cancelled) return;

            const incoming = Object.entries(map).map(([id, v]) => ({
                id: String(id),
                stockStatus: v?.stockStatus ?? null,
                reservedTo: v?.reservedTo ?? null
            }));

            setVehicleStatuses(prev => {
                const byId = new Map(prev.map(x => [String(x.id), x]));
                for (const row of incoming) byId.set(row.id, { ...(byId.get(row.id) || {}), ...row });
                return Array.from(byId.values())
            })
        })();
        return () => { cancelled = true }
    }, [selectedContact?.id])
    //



    // 🔁 CHAT LIST: infinite load for the list (respects search)
    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !pageCursor) return;
        setLoadingMore(true);

        const trimmed = (searchQuery || "").trim();
        const keywords =
            trimmed
                ? (trimmed.includes("-")
                    ? buildDashVariantsLower(trimmed)
                    : cleanManyLower([trimmed])
                )
                : [];

        try {
            const { items, hasMore: nextHasMore, cursor: nextCursor } =
                await loadMoreChatList(userEmail, { cursor: pageCursor, keywords });

            setChatList(prev => [...prev, ...items]);
            setHasMore(nextHasMore);
            setPageCursor(nextCursor);
        } catch (error) {
            console.error("Error loading more chats:", error);
            setHasMore(false)
        } finally {
            setLoadingMore(false)
        }
    }, [userEmail, searchQuery, hasMore, loadingMore, pageCursor])

    const isDetail = segments[0] === 'chats' && segments.length > 1

    // booking doc sub
    useEffect(() => {
        setLoadingBooking(true);
        if (!userEmail || !selectedContact?.invoiceNumber) {
            return
        }

        // We need 'query', 'collection', 'where', 'onSnapshot' to be loaded
        // This is tricky because it's inside a useEffect that runs on selectedContact change.
        // We'll use an async IIFE inside the effect.
        let unsubscribe = () => {};
        let active = true;

        (async () => {
            try {
                const [firestore, { collection, query, where, onSnapshot }] = await Promise.all([
                    getFirebaseFirestore(),
                    import("firebase/firestore")
                ]);
                
                if (!active) return;

                const q = query(
                    collection(firestore, 'booking'),
                    where('invoiceNumber', '==', selectedContact?.invoiceNumber),
                    where('customerEmail', '==', userEmail)
                )

                unsubscribe = onSnapshot(q, snapshot => {
                    if (snapshot.empty) {
                        setBookingData(null)
                    } else {
                        const doc = snapshot.docs[0]
                        setBookingData({ id: doc.id, ...doc.data() })
                    }
                    setLoadingBooking(false)
                })
            } catch (err) {
                console.error("Failed to setup booking sub", err);
                setLoadingBooking(false);
            }
        })();

        return () => {
            active = false;
            unsubscribe();
        };
    }, [selectedContact?.invoiceNumber, userEmail])

    return (

            <SortProvider>
                <div className="flex h-screen bg-gray-50">
                    {/* LIST PANE */}
                    <aside
                        className={`
                        ${!isDetail ? 'block' : 'hidden'}
                        md:block
                        w-full md:w-[350px]
                        border-r border-gray-200
                        overflow-y-auto
                    `}
                    >
                        <TransactionList
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            makeTrueRead={makeTrueRead}
                            loadingMore={loadingMore}
                            hasMore={hasMore}
                            bookingData={bookingData}
                            setSelectedContact={setSelectedContact}
                            selectedContact={selectedContact}
                            onSelectContact={handleSelectContact}
                            chatId={chatId}
                            setChatId={setChatId} // Pass setChatId as a prop
                            loadMore={loadMore}
                            userEmail={userEmail}
                            setChatList={setChatList}
                            chatList={chatList}
                            vehicleStatus={vehicleStatuses}
                        />
                    </aside>

                    {/* DETAIL PANE */}
                    {isLoadingTransaction ? (
                        isMobileView ? (
                            <div className="h-screen w-screen">
                                <TransactionCSRLoader />
                            </div>
                        ) : (
                            <div className="
                    md:block
                    flex-1
                    h-full
                    overflow-y-auto">

                                <TransactionCSRLoader />
                            </div>
                        )
                    ) : (
                        <main
                            className={`
                    ${isDetail ? 'block' : 'hidden'}
                    md:block
                    flex-1
                    h-full
                    overflow-y-auto
                `}
                        >
                            {isDetail ? (
                                <TransactionCSR
                                    loadingBooking={loadingBooking}
                                    vehicleStatus={vehicleStatuses}
                                    accountData={accountData}
                                    isMobileView={true}
                                    isDetailView={isDetail}
                                    handleBackToList={handleBackToList}
                                    bookingData={bookingData}
                                    countryList={countryList}
                                    currency={currency}
                                    dueDate={invoiceData?.formattedDate}
                                    handleLoadMore={handleLoadMore}
                                    invoiceData={invoiceData?.invoiceData}
                                    chatId={chatId}
                                    userEmail={userEmail}
                                    chatMessages={chatMessages}
                                    contact={selectedContact}
                                    messages={messages}
                                    onSendMessage={sendMessage}
                                    isLoading={isLoading}
                                    isLoadingTransaction={isLoadingTransaction} // Pass the prop
                                />
                            ) : chatList.length > 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <h3 className="text-xl font-medium text-gray-600">Select a transaction</h3>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <h3 className="text-xl font-medium text-gray-600">
                                        No orders yet
                                    </h3>
                                    <p className="mt-2 text-gray-500">
                                        Browse our car stock and add vehicles to your order list.
                                    </p>
                                    <Link
                                        href="/stock"
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Browse Car Stock
                                    </Link>
                                </div>
                            )}
                        </main>
                    )}
                    {/* <SurveyModal isOpen={isSurveyOpen} onClose={() => setIsSurveyOpen(false)} /> */}


                </div>
            </SortProvider>
   
    );
}