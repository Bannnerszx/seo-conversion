// // pages/api/models.js
// import { fetchVehicleProducts } from "../../../services/fetchFirebaseData";

// export default async function handler(req, res) {
//   const { limit } = req.query;
//   const limitNum = parseInt(limit || '10');
//   console.log(limit, 'useEffect')
//   try {
//     const products = await fetchVehicleProducts({
//       limit: limitNum
//     });
    
//     res.status(200).json(products);
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     res.status(500).json({ error: 'Error fetching products' });
//   }
// }