// components/ConvertVehicleProductsButton.jsx
import { useState } from 'react';

export default function ConvertVehicleProductsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleConvert = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/convertVehicleProducts', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleConvert}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Converting…' : 'Convert VehicleProducts'}
      </button>

      {message && (
        <p className="mt-2 text-green-600">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-2 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
