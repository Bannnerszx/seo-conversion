import { collection, getDocs, query, where, getCountFromServer } from "firebase/firestore";
import { firestore } from "../../../firebase/clientApp";

export async function getServerSideProps() {
    try {
        // Create the Firestore query
        const q = query(
            collection(firestore, "VehicleProducts"),
            where("imageCount", ">", 0),
            where("stockStatus", "==", "On-Sale")
        );

        // Fetch the count
        const snapshot = await getCountFromServer(q);
        const totalCount = snapshot.data().count || 0;

        // Fetch the items matching the query
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Sort the items if needed (e.g., by price descending)
        const sortedItems = fetchedItems.sort((a, b) => b.price - a.price); // Adjust the field as needed

        return {
            props: {
                totalCount,
                items: sortedItems,
            },
        };
    } catch (error) {
        console.error("Error fetching VehicleProducts:", error);
        return {
            props: {
                totalCount: 0,
                items: [],
            },
        };
    }
}

export default function VehicleProductsPage({ totalCount, items }) {
    return (
        <div>
            <h1>Vehicle Products</h1>
            <p>Total Items: {totalCount}</p>
            
        </div>
    );
}
