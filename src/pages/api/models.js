// pages/api/models.js
import { fetchCarModels } from "../../../services/fetchFirebaseData";
import { db } from "@/lib/firebaseAdmin"; // Your Admin SDK instance

export default async function handler(req, res) {
    const { make } = req.query;
    if (!make) {
        return res.status(400).json({ error: "Missing 'make' parameter" });
    }

    try {
        const models = await fetchCarModels(db, make);
        res.status(200).json({ models });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Error fetching models' });
    }
}
