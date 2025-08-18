'use client';

import React, { useState } from 'react';

// You can assume Tailwind CSS is set up in your Next.js project.
// The necessary fonts would typically be configured in your layout file.

export default function ErrorGeneratorPage() {
    const makeError = () => {
        // This line will cause a TypeError because you cannot
        // read a property ('oops') from a null object.
        const invalidObject = null;
        console.log(invalidObject.oops);
    };


    return (
        <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen font-sans">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-4">Error Generator</h1>
                <p className="text-gray-400 mb-6">Click the button below to trigger a custom JavaScript error in a Next.js app.</p>

                {/* Button to trigger the error */}
                <button onClick={makeError} style={{ padding: '10px', fontSize: '16px' }}>
                    Click to Cause a Client-Side Error
                </button>

                {/* Area to display the result or error message */}
                <div className="bg-gray-700 p-4 rounded-lg text-left h-24 overflow-auto">
                    <p className={getTextColor()}>
                        {outputMessage.text}
                    </p>
                </div>
            </div>
        </div>
    );
}
