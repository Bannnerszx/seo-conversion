import { useState } from 'react';

export default function MigrateButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleMigrate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/migrate', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Migration failed');
            setResult(`Migrated ${data.migrated} documents.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleMigrate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Migrating…' : 'Run Migration'}
            </button>
            {result && <p className="mt-2 text-green-600">{result}</p>}
            {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>
    );
};