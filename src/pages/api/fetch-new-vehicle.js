import { fetchVehicleProducts } from "../../../services/fetchFirebaseData"; 


export default async function handler(req, res) {
    try {
        const { carMakes, carModels, limit = 10, bodytype, lastVisible } = req.query;
        // You might need to parse lastVisible if it's serialized in some way

        const result = await fetchVehicleProducts({
            carMakes: carMakes || null,
            carModels: carModels || null,
            limit: parseInt(limit),
            bodytype: bodytype || null,
            lastVisible: lastVisible || null // ensure proper handling/serialization
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching vehicle products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}