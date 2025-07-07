export default async function handler(req, res) {
    if (req.method === 'POST') {
      // For pages API routes, the body is already parsed (if using built-in middleware)
      const { country, port } = req.body;
      
      // Process the data as needed
      res.status(200).json({ country, port });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  