import { fetchInspection } from "../../../services/fetchFirebaseData";

export default async function handler(req, res) {
  // Expecting the query parameter to be named "selectedPort"
  const { selectedPort } = req.query;
  if (!selectedPort) {
    return res.status(400).json({ error: "Missing 'selectedPort' parameter" });
  }

  try {
    const portInspectionData = await fetchInspection(selectedPort);
    res.status(200).json({ portsInspection: portInspectionData });
  } catch (error) {
    console.error("Error fetching ports:", error);
    res.status(500).json({ error: "Error fetching ports" });
  }
}
