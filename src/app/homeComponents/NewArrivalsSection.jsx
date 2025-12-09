
import { fetchNewVehicle ,fetchCurrency} from '../../../services/fetchFirebaseData';
import NewArrivals from './NewArrivals';

export default async function NewArrivalsSection() {
  const [newVehicles, currency] = await Promise.all([
    fetchNewVehicle(),
    fetchCurrency()
  ]);

  return <NewArrivals newVehicles={newVehicles} currency={currency} />;
}