export default async function handler(req, res) {
    try {
      const response = await fetch('https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body) // or '{}' if no payload is needed
      });
      
      // Check if response is not OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from Firebase function:', errorText);
        return res.status(response.status).json({ error: errorText });
      }
      
      // Attempt to parse JSON only if status is OK
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ error: 'Failed to fetch Tokyo time' });
    }
  }
  