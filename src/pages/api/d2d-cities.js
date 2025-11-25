import { db } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { countryId } = req.query;

    if (!countryId) {
        return res.status(400).json({ error: 'Missing countryId parameter' });
    }

    try {
        const citiesSnapshot = await db
            .collection('CustomerCountryPort')
            .doc('CountriesDoc')
            .collection('D2DCountries')
            .doc(countryId)
            .collection('cities')
            .get()

        if (citiesSnapshot.empty) {
            return res.status(200).json({ cities: [] });
        }

        const cities = citiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({ cities });
    } catch (error) {
        console.error('Error fetching D2D cities:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}