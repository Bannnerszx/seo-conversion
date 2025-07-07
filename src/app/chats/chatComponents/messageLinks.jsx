"use client";

import Link from "next/link";
import { File } from "lucide-react";
import ImageViewer from "./imageViewer";

// Helper function to render text with clickable links
const renderTextWithLinks = (text) => {
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    if (!text) return null;

    const parts = text.split(urlRegex);
    const matches = text.match(urlRegex) || [];

    return (
        <>
            {parts.map((part, index) => {
                // If this part is a URL, render it as a link
                if (matches.includes(part)) {
                    return (
                        <Link
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {part}
                        </Link>
                    );
                }
                // Otherwise, render it as regular text
                return <span key={index}>{part}</span>;
            })}
        </>
    );
};

const ChatMessage = ({ message, userEmail }) => {
    const isCurrentUser = message.sender === userEmail;

    if (message.messageType !== undefined) {
        return null;
    }

    const handleOpenLink = (url) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <>
            {/* <div className="text-sm">{renderTextWithLinks(message.text)}</div> */}

            {message.file && (
                <div className="mt-2">
                    {message.file.type === "image" ? (
                        <ImageViewer uri={message.file.url} alt="Shared image" />
                    ) : (
                        <button
                            onClick={() => handleOpenLink(message.file.url || "")}
                            className="flex flex-row items-center text-red-500"
                        >
                            <File className="h-4 w-4 text-red-500" />
                            <span className="underline ml-1">
                                {message.file.name || "Download file"}
                            </span>
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatMessage;
