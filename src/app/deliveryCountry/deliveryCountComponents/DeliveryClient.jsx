"use client";

import { useState, useEffect } from "react";
import { functions } from "../../../../firebase/clientApp";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";


// Get a reference to the callable function
const addDeliveryLocation = httpsCallable(functions, "addDeliveryLocation");

export default function DeliveryClient({ userEmail }) {
  // State for form inputs
  const [countryName, setCountryName] = useState("");
  const [cityName, setCityName] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState("");

  // State for loading and response messages
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState({
    message: "",
    isError: false,
    show: false,
  });
  const [isAuthReady, setIsAuthReady] = useState(true);

  // Effect for handling authentication


  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const price = parseFloat(deliveryPrice);

    // Basic validation
    if (!countryName || !cityName || isNaN(price) || price < 0) {
      setResponse({
        message: "Please fill out all fields correctly.",
        isError: true,
        show: true,
      });
      return;
    }

    if (!isAuthReady) {
      setResponse({
        message: "Please wait, authenticating...",
        isError: true,
        show: true,
      });
      return;
    }

    setIsLoading(true);
    setResponse({ message: "", isError: false, show: false });

    try {
      // Call the cloud function with the data
      const result = await addDeliveryLocation({
        countryName,
        cityName,
        deliveryPrice: price,
        userEmail, // optional extra field if you want it in your CF
      });

      console.log("Function result:", result.data);
      setResponse({
        message: result.data.message,
        isError: false,
        show: true,
      });

      // Reset form
      setCountryName("");
      setCityName("");
      setDeliveryPrice("");
    } catch (error) {
      console.error("Error calling function:", error);
      setResponse({
        message: `Error: ${error.message}`,
        isError: true,
        show: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-gray-100 font-sans min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Add Delivery Location
        </h1>

        <form id="location-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700"
            >
              Country Name
            </label>
            <input
              type="text"
              id="country"
              name="country"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Tanzania"
              value={countryName}
              onChange={(e) => setCountryName(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700"
            >
              City Name
            </label>
            <input
              type="text"
              id="city"
              name="city"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Dar Es Salaam"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Delivery Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="15"
              value={deliveryPrice}
              onChange={(e) => setDeliveryPrice(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            id="submit-button"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? "opacity-75" : ""
              }`}
            disabled={isLoading || !isAuthReady}
          >
            {isLoading
              ? "Adding..."
              : isAuthReady
                ? "Add Location"
                : "Authenticating..."}
          </button>
        </form>

        {response.show && (
          <div
            id="response"
            className={`mt-6 p-4 rounded-md text-sm ${response.isError
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
              }`}
          >
            {response.message}
          </div>
        )}
      </div>
    </main>
  );
}
