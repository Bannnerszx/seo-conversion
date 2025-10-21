'use client'

import { useState, useEffect } from 'react';
import { functions } from '../../firebase/clientApp';
import { httpsCallable } from 'firebase/functions';
const DEFAULT_NETWORK_TIMEOUT = 15000; // 15s per attempt
const DEFAULT_NETWORK_RETRIES = 2; // number of retries after the first attempt

export default function SendMessage() {
    const [message, setMessage] = useState('This is an automated message.');
    const [response, setResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
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
    // --- AUTHENTICATION ---
    // Handle user authentication state when the component mounts.

    const sendFilteredMessages = httpsCallable(functions, 'sendFilteredMessagesV2');

    // --- BUTTON CLICK HANDLER ---
    let currentIpInfo
    let currentTokyoTime
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
    const handleSendMessage = async () => {


        setIsLoading(true);
        setResponse(null); // Clear previous response

        try {
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
            // You can specify a region if needed:
            // const functions = firebase.app().functions('your-region');
            const formattedTime = formatTokyoLocal(currentTokyoTime?.datetime);
            // Extract IP info details
            const ip = currentIpInfo.ip;
            const ipCountry = currentIpInfo.country_name;
            const ipCountryCode = currentIpInfo.country_code;

            // --- PREPARE THE DATA PAYLOAD ---
            const messageData = {
                userEmail: 'marc@realmotor.jp',
                newMessage: message,
                formattedTime: formattedTime,
                ip: ip,
                ipCountry: ipCountry,
                ipCountryCode: ipCountryCode
            };

            // --- CALL THE FUNCTION ---
            console.log("Calling 'sendFilteredMessagesV2' with data:", messageData);
            const result = await sendFilteredMessages(messageData);
            console.log("Cloud Function returned:", result);

            // --- DISPLAY THE RESULT ---
            setResponse({ type: 'success', data: result.data });

        } catch (error) {
            console.error("Error calling Cloud Function:", error);
            setResponse({ type: 'error', data: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 text-gray-800 flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-2xl font-bold mb-2 text-center">Cloud Function Sender</h1>
                <p className="text-gray-600 mb-6 text-center">Click the button to filter and send a test message to the first eligible recipient.</p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="message-text" className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                        <textarea
                            id="message-text"
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Enter your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : 'Send Test Message'}
                    </button>
                </div>

                {response && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-lg font-semibold mb-2">Function Response:</h2>
                        <pre className="text-sm text-left whitespace-pre-wrap break-all">
                            {JSON.stringify(response.data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
