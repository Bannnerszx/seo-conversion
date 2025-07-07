import { fetchInspectionToggle } from "../../../services/fetchFirebaseData";


export default async function handler(req, res) {
  try {
    // Ensure the request is a GET request
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the country from the query parameters
    const { country } = req.query;

    // Validate that a country was provided
    if (!country) {
      return res.status(400).json({ error: 'Country parameter is required' });
    }

    // Call your function that fetches the inspection toggle details
    const inspectionData = await fetchInspectionToggle(country);

    // Handle the case where no data is returned
    if (!inspectionData) {
      return res.status(404).json({ error: 'Inspection data not found for the provided country' });
    }

    // Destructure the required fields from the returned object
    const { inspectionName, inspectionIsRequired, toggle, isToggleDisabled } = inspectionData;

    // Return the data as JSON
    return res.status(200).json({
      inspectionName,
      inspectionIsRequired,
      toggle,
      isToggleDisabled,
    });
  } catch (error) {
    // Log and return any errors encountered
    console.error('Error fetching inspection data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}