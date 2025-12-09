import { getMakeCounts } from '../actions/actions';
import SearchByMakers from './SearchbyMakers';

export default async function MakersSection() {
  const brandNames = ['TOYOTA', 'NISSAN', 'HONDA', 'MITSUBISHI', 'MERCEDES-BENZ', 'BMW', 'SUZUKI', 'SUBARU', 'VOLKSWAGEN', 'MAZDA'];
  
  // Fetch data in parallel
  const entries = await Promise.all(
    brandNames.map(name => getMakeCounts(name).then(count => [name, count]))
  );
  
  const makeCounts = Object.fromEntries(entries);

  return <SearchByMakers makeCounts={makeCounts} />;
}