import { fetchPorts } from "../../../services/fetchFirebaseData";

export default async function handler(req, res) {
  // Destructure the "ports" query parameter instead of "selectedCountry"
  const { ports } = req.query;
  if (!ports) {
    return res.status(400).json({ error: "Missing 'ports' parameter" });
  }

  try {
    const portData = await fetchPorts(ports);
    res.status(200).json({ ports: portData });
  } catch (error) {
    console.error('Error fetching ports:', error);
    res.status(500).json({ error: 'Error fetching ports' });
  }
}
