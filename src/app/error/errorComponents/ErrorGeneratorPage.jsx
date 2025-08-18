'use client';

import React, { useState } from 'react';

// You can assume Tailwind CSS is set up in your Next.js project.
// The necessary fonts would typically be configured in your layout file.

export default function ErrorGeneratorPage() {
  // useState hook to manage the message displayed in the output box.
  const [outputMessage, setOutputMessage] = useState({
    text: 'Waiting for action...',
    type: 'info' // 'info', 'success', or 'error'
  });

  /**
   * This function intentionally throws a new Error.
   * The 'throw' keyword stops its execution.
   */
  const generateError = () => {
    throw new Error("Oops! This is a deliberate error from a Next.js component.");
  };

  /**
   * Handles the button click event.
   * It uses a try...catch block to gracefully handle the error.
   */
  const handleErrorClick = () => {
    try {
      // We 'try' to run the code that might cause an error.
      console.log("Attempting to generate an error...");
      generateError();
      
      // This line will NOT be reached if an error is thrown.
      setOutputMessage({
        text: 'Success! No error was thrown.',
        type: 'success'
      });

    } catch (error) {
      // If an error occurs, the 'catch' block executes.
      console.error("An error was caught:", error);
      
      // We update the state with the error information to display it.
      if (error instanceof Error) {
        setOutputMessage({
          text: `Caught an error: ${error.message}`,
          type: 'error'
        });
      } else {
        setOutputMessage({
          text: 'Caught an unknown error.',
          type: 'error'
        });
      }
    }
  };

  // Helper to determine the text color based on the message type.
  const getTextColor = () => {
    switch (outputMessage.type) {
      case 'error':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen font-sans">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Error Generator</h1>
        <p className="text-gray-400 mb-6">Click the button below to trigger a custom JavaScript error in a Next.js app.</p>
        
        {/* Button to trigger the error */}
        <button 
          onClick={handleErrorClick}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 w-full mb-6"
        >
          Throw Error
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
