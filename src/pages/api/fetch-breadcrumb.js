
import { getDb } from "@/lib/mongodbClient";

const dbMong = await getDb()

const vehicleColl = dbMong.collection("VehicleProducts");



export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { stockId = "" } = req.query

    if (!stockId) {
        return res
            .status(400)
            .json({ error: "Missing required query parameter: stockId" })
    }

    try {

        // find the one document matching stockID
        const vehicle = await vehicleColl.findOne(
            { stockID: stockId },
            { projection: { _id: 0, make: 1, model: 1, carName: 1 } }
        )

        if (!vehicle) {
            return res
                .status(404)
                .json({ error: `No vehicle found with stockID ${stockId}` })
        }

        // return exactly { maker, model, carName }
        return res.status(200).json(vehicle)
    } catch (err) {
        console.error("Error fetching vehicle:", err)
        return res
            .status(500)
            .json({ error: "Unable to fetch vehicle data" })
    }
}