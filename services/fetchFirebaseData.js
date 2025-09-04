import { db } from "@/lib/firebaseAdmin";
import { getDb } from "@/lib/mongodbClient";
import { unstable_cache as cache } from "next/cache";
const dbMong = await getDb()
const vehicleColl = dbMong.collection("VehicleProducts");

export async function fetchCarMakes() {
  try {
    // Assuming your "Make" collection has a document "Make" that stores an array of makes in the "make" field.
    const makeDocRef = db.collection('Make').doc('Make');
    const snapshot = await makeDocRef.get();
    return snapshot.data()?.make || [];
  } catch (error) {
    console.error('Error fetching car makes:', error);
    return [];
  }
}
export async function fetchCarModels(db, selectedMake) {
  try {
    if (!selectedMake) return []; // Ensure a make is selected

    const modelDocRef = db.collection('Model').doc(selectedMake);
    const snapshot = await modelDocRef.get();

    return snapshot.exists ? snapshot.data()?.model || [] : [];
  } catch (error) {
    console.error(`Error fetching models for ${selectedMake}:`, error);
    return [];
  }
};
export async function fetchCarBodytype() {
  try {
    // Reference the document in "BodyType" collection
    const docRef = db.collection("BodyType").doc("BodyType");
    const snapshot = await docRef.get();

    // Retrieve the 'bodyType' array from the document
    return snapshot.exists ? snapshot.data()?.bodyType || [] : [];
  } catch (error) {
    console.error("Error fetching body types:", error);
    return [];
  }
}

export const getUnsoldVehicleCount = async () => {
  try {
    const snapshot = await db.collection('VehicleProducts')
      .where('stockStatus', '==', 'On-Sale')
      .where('imageCount', '>', 0)
      .count()
      .get();

    return snapshot.data()?.count ?? 0;
  } catch (error) {
    console.error('Error fetching document count:', error);
    return 0; // Return null instead of 0 to indicate an error
  }
};

// export async function fetchCountries() {
//   try {
//     // Reference the Firestore document
//     const countryRef = db.collection('CustomerCountryPort').doc('CountriesDoc');
//     const docSnapshot = await countryRef.get();

//     if (!docSnapshot.exists) {
//       console.log("No such document!");
//       return [];
//     }

//     const data = docSnapshot.data();
//     const prioritizedCountries = ['Zambia', 'Tanzania', 'Mozambique', 'Kenya', 'Uganda', 'Zimbabwe', 'D_R_Congo'];

//     // Prioritized countries
//     const prioritizedSorted = prioritizedCountries.filter(country => country in data);

//     // Sort the remaining countries alphabetically
//     const otherCountriesSorted = Object.keys(data)
//       .filter(country => !prioritizedCountries.includes(country))
//       .sort();

//     // Combine prioritized and alphabetized countries
//     return [...prioritizedSorted, ...otherCountriesSorted];

//   } catch (error) {
//     console.error("Error fetching countries:", error);
//     return [];
//   }
// }

export const fetchCountries = cache(
  async () => {
    console.log('Cache MISS: Fetching country list from Firestore.');
    try {
      //Reference the Firestore document
      const countryRef = db.collection('CustomerCountryPort')
        .doc('CountriesDoc');
      const docSnapshot = await countryRef.get();

      if (!docSnapshot.exists) {
        console.log("No such document!")
      }
      const data = docSnapshot.data();
      const prioritizedCountries = ['Zambia', 'Tanzania', 'Mozambique',
        'Kenya', 'Uganda', 'Zimbabwe', 'D_R_Congo'
      ];

      //Prioritized countries
      const prioritizedSorted = prioritizedCountries.filter(country => country in data);

      //Sort the remaining countries alphabetically
      const otherCountriesSorted = Object.keys(data)
        .filter(country => !prioritizedCountries.includes(country))
        .sort();

      //Combine prioritized and alphabetized countries
      return [...prioritizedSorted, ...otherCountriesSorted]
    } catch (error) {
      console.error('Error fetching countries:', error)

      return [];
    }
  },
  {
    revalidate: 604800,
    tags: ['static-data', 'countries']
  }
);

export async function fetchPorts(selectedCountry) {
  try {
    // Reference Firestore document
    const countriesDocRef = db.collection('CustomerCountryPort').doc('CountriesDoc');
    const docSnapshot = await countriesDocRef.get();

    if (!docSnapshot.exists) {
      console.log("CountriesDoc document does not exist!");
      return [];
    }

    const countriesData = docSnapshot.data();
    const countryData = countriesData[selectedCountry];

    if (!countryData || !countryData.nearestPorts) {
      console.log(`No nearestPorts data found for ${selectedCountry}`);
      return [];
    }

    // Return an array of port names
    return countryData.nearestPorts;

  } catch (error) {
    console.error("Error fetching ports:", error);
    return [];
  }
};

//fetch newVehicles
// export async function fetchNewVehicle() {
//   try {
//     // Build a query that only selects the five fields we need
//     let queryRef = db
//       .collection('VehicleProducts')
//       .select(
//         'fobPriceNumber',
//         'carName',
//         'regYearNumber',
//         'regMonth',
//         'images'
//       )
//       .where('imageCount', '>', 0)
//       .where('stockStatus', '==', 'On-Sale')
//       .orderBy('dateAdded', 'desc')
//       .limit(6);

//     const snapshot = await queryRef.get();
//     const newProducts = [];

//     snapshot.forEach((doc) => {
//       const data = doc.data();
//       newProducts.push({
//         id: doc.id,
//         fobPrice: data.fobPriceNumber,
//         carName: data.carName,
//         regYear: data.regYearNumber,
//         regMonth: data.regMonth,
//         images: Array.isArray(data.images) ? data.images : []
//       });
//     });

//     return newProducts;
//   } catch (error) {
//     console.error(
//       'Error fetching vehicle products:',
//       error
//     );
//     return [];
//   }
// }

export const fetchNewVehicle = cache(
  async () => {
    try {
      console.log('Cache MISS: Fetching new vehicles from Firestore.');

      const queryRef = db
        .collection('VehicleProducts')
        .select(
          'fobPriceNumber',
          'carName',
          'regYearNumber',
          'regMonth',
          'images'
        )
        .where('imageCount', '>', 0)
        .where('stockStatus', '==', 'On-Sale')
        .orderBy('dateAdded', 'desc')
        .limit(6);

      const snapshot = await queryRef.get();
      const newProducts = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        newProducts.push({
          id: doc.id,
          fobPrice: data.fobPriceNumber,
          carName: data.carName,
          regYear: data.regYearNumber,
          regMonth: data.regMonth,
          images: Array.isArray(data.images) ? data.images : [],
        });
      });

      return newProducts;
    } catch (error) {
      console.error('Error fetching vehicle products:', error);
      return [];
    }
  },
  ['new-vehicles'], // 1. Unique cache key
  { revalidate: 60 } // 2. Options object with revalidate time
);


// /services/fetch.js
// services/fetchFirebaseData.js

const cursorCache = {};

// export async function fetchVehicleProductsByPage({
//   searchKeywords = '',
//   page = 1,
//   carMakes = null,
//   carModels = null,
//   carBodyType = '',
//   sortField = "dateAdded",
//   sortDirection = "asc",
//   itemsPerPage = 50,
//   minPrice = 0,
//   maxPrice = 0,
//   minYear = 0,
//   maxYear = 0,
//   minMileage = 0,
//   maxMileage = 0,
//   currency
// }) {
//   // Step 1: Base filtered query
//   let q = db
//     .collection("VehicleProducts")
//     .where("imageCount", ">", 0)
//     .where("stockStatus", "==", "On-Sale");
//   if (searchKeywords) q = q.where('keywords', 'array-contains', searchKeywords.toLowerCase())
//   if (carMakes) q = q.where("make", "==", carMakes);
//   if (carModels) q = q.where("model", "==", carModels);
//   if (carBodyType) q = q.where("bodyType", "==", carBodyType);
//   if (minPrice) q = q.where('fobPriceNumber', ">=", Number(minPrice) / currency);
//   if (maxPrice) q = q.where('fobPriceNumber', '<=', Number(maxPrice) / currency);
//   if (minYear) q = q.where('regYearNumber', '>=', minYear);
//   if (maxYear) q = q.where('regYearNumber', '<=', maxYear);
//   if (minMileage) q = q.where('mileageNumber', '>=', minMileage);
//   if (maxMileage) q = q.where('mileageNumber', '<=', maxMileage);
//   // Step 2: Count total
//   const countSnap = await q.count().get();

//   const totalCount = countSnap.data().count;

//   console.log(sortField, sortDirection)
//   // Step 3: Sort
//   q = q.orderBy(sortField, sortDirection);

//   // Step 4: Apply cursor for pages > 1
//   if (page > 1) {
//     const prevCursor = cursorCache[page - 1];
//     if (!prevCursor) throw new Error("Missing cursor for page " + page);
//     q = q.startAfter(prevCursor);
//   }

//   // Step 5: Limit
//   q = q.limit(itemsPerPage);

//   // Step 6: Fetch
//   const snap = await q.get();

//   const products = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

//   // Step 7: Save cursor for next page
//   const lastDoc = snap.docs[snap.docs.length - 1];
//   cursorCache[page] = lastDoc || null;

//   return { products, totalCount, currentPage: page };
// }



export const fetchVehicleProductsByPage = cache(
  async ({
    searchKeywords = "",
    page = 1,
    carMakes = null,
    carModels = null,
    carBodyType = "",
    subBodyType = "",
    sortField = "dateAdded",
    sortDirection = "asc",
    itemsPerPage = 50,
    minPrice = 0,
    maxPrice = 0,
    minYear = 0,
    maxYear = 0,
    minMileage = 0,
    maxMileage = 0,
    currency,
    color,
    transmission,
    minEngineDisplacement = 0,
    maxEngineDisplacement = 0,
    driveType,
    steering,
    features = null,
    fuelType = "",
    isRecommended = null,
    isSale = null
  }) => {
    const FEATURES = [
      { id: "SafetySystemAnBrSy", label: "Anti-Lock Brakes", code: 1 },
      { id: "SafetySystemDrAi", label: "Driver Airbag", code: 2 },
      { id: "SafetySystemPaAi", label: "Passenger Airbag", code: 3 },
      { id: "SafetySystemSiAi", label: "Side Airbag", code: 4 },
      { id: "InteriorPoWi", label: "Power Windows", code: 5 },
      { id: "InteriorReWiDe", label: "Rear Window Defrost", code: 6 },
      { id: "InteriorReWiWi", label: "Rear Window Wiper", code: 7 },
      { id: "InteriorTiGl", label: "Tinted Glass", code: 8 },
      { id: "ComfortAiCoFr", label: "A/C: front", code: 9 },
      { id: "ComfortAiCoRe", label: "A/C: rear", code: 10 },
      { id: "ComfortCrSpCo", label: "Cruise Control", code: 11 },
      { id: "ComfortNaSyGPS", label: "Navigation System", code: 12 },
      { id: "ComfortPoSt", label: "Power Steering", code: 13 },
      { id: "ComfortReKeSy", label: "Keyless Entry", code: 14 },
      { id: "ComfortTiStWh", label: "Tilt Wheel", code: 15 },
      { id: "ComfortDiSp", label: "Digital Meter", code: 16 },
      { id: "ComfortAMFMRa", label: "AM/FM Radio", code: 17 },
      { id: "ComfortAMFMSt", label: "AM/FM Stereo", code: 18 },
      { id: "ComfortCDCh", label: "CD Changer", code: 19 },
      { id: "ComfortCDPl", label: "CD Player", code: 20 },
      { id: "ComfortPrAuSy", label: "Premium Sound", code: 21 },
      { id: "ComfortDVDPl", label: "DVD Player", code: 22 },
      { id: "ComfortHDD", label: "Hard Disc", code: 23 },
      { id: "InteriorLeSe", label: "Leather Seats", code: 24 },
      { id: "InteriorPoSe", label: "Power Seats", code: 25 },
      { id: "ExteriorAlWh", label: "Alloy Wheels", code: 26 },
      { id: "InteriorPoDoLo", label: "Power Door Locks", code: 27 },
      { id: "InteriorPoMi", label: "Power Mirrors", code: 28 },
      { id: "ExteriorSuRo", label: "Sunroof", code: 29 },
      { id: "InteriorThRoSe", label: "Third Row Seats", code: 30 },
      { id: "ExteriorPoSlDo", label: "Sliding Door", code: 31 },
      { id: "SellingPointsCuWh", label: "Custom Wheels", code: 32 },
      { id: "SellingPointsFuLo", label: "Fully Loaded", code: 33 },
      { id: "SellingPointsMaHiAv", label: "Maintenance Rec.", code: 34 },
      { id: "SellingPointsReBo", label: "New Paint", code: 35 },
      { id: "SellingPointsBrNeTi", label: "New Tires", code: 36 },
      { id: "SellingPointsNoAcHi", label: "No Accidents", code: 37 },
      { id: "SellingPointsOnOwHi", label: "One Owner", code: 38 },
      { id: "SellingPointsPeRaTi", label: "Performance Tires", code: 39 },
      { id: "SellingPointsUpAuSy", label: "Upgraded Sound", code: 40 },
      { id: "SellingPointsNoSmPrOw", label: "Non-Smoker", code: 41 },
      { id: "SellingPointsTuEn", label: "Turbo", code: 42 },
    ];
    const codeToId = FEATURES.reduce((m, f) => {
      m[f.code] = f.id;
      return m;
    }, {});

    // 2) Build Mongo filter
    const filter = {
      stockStatus: "On-Sale",
      rmj_flg: "1"
    };
    if (isRecommended) {
      filter.isRecommended = isRecommended;
    }
    if (isSale) {
      filter.isSale = isSale
    }
    if (searchKeywords) {
      // 1) Replace pluses with spaces
      const withSpaces = searchKeywords.replace(/\+/g, " ");
      // 2) Decode any %XX escapes
      const decoded = decodeURIComponent(withSpaces);
      // 3) Upper-case for your keywords array
      const lookup = decoded.toLowerCase();

      // Now make Mongo match documents whose "keywords" array contains that value:
      filter.keywords = lookup;
    }

    if (carMakes) filter.make = carMakes;
    if (carModels) filter.model = carModels;
    if (carBodyType) filter.bodyType = carBodyType;
    if (subBodyType) filter.subBodyType = subBodyType;
    if (fuelType) filter.fuel = fuelType
    if (minPrice) filter.fobPriceNumber = { ...(filter.fobPriceNumber ?? {}), $gte: Number(minPrice / currency) };
    if (maxPrice) filter.fobPriceNumber = { ...(filter.fobPriceNumber ?? {}), $lte: Number(maxPrice / currency) };
    if (minYear) filter.regYearNumber = { ...(filter.regYearNumber ?? {}), $gte: Number(minYear) };
    if (maxYear) filter.regYearNumber = { ...(filter.regYearNumber ?? {}), $lte: Number(maxYear) };
    if (minMileage) filter.mileageNumber = { ...(filter.mileageNumber ?? {}), $gte: Number(minMileage) };
    if (maxMileage) filter.mileageNumber = { ...(filter.mileageNumber ?? {}), $lte: Number(maxMileage) };
    if (color) filter.exteriorColor = color;
    if (transmission) filter.transmission = transmission;
    if (minEngineDisplacement) filter.engineDisplacementNumber = { ...(filter.engineDisplacementNumber ?? {}), $gte: Number(minEngineDisplacement) }
    if (maxEngineDisplacement) filter.engineDisplacementNumber = { ...(filter.engineDisplacementNumber ?? {}), $lte: Number(maxEngineDisplacement) }
    if (steering) filter.steering = steering
    if (driveType) {
      const withSpaces = driveType.replace(/\+/g, " ")
      filter.driveType = decodeURIComponent(withSpaces)
    }
    if (features) {
      let codes;
      try {
        codes = JSON.parse(features);
      } catch {
        codes = [];
      }
      if (Array.isArray(codes)) {
        codes.forEach(code => {
          const fid = codeToId[Number(code)];
          if (fid) {
            // set the boolean field to true
            filter[fid] = true;
          }
        });
      }
    }
    // 3) Get total count
    const countPromise = vehicleColl.countDocuments(filter, { maxTimeMS: 1200 })
      .catch(() => null);
    // const totalCount = 50
    // 4) Fetch paged results
    const sortOrder = sortDirection === "asc" ? 1 : -1;
    const projection = {
      // you always need these identifiers:
      _id: 1,
      dateAdded: 1,
      "Document ID": 1,
      rmj_flg: 1,
      make: 1,
      model: 1,
      exteriorColor: 1,
      transmission: 1,
      bodyType: 1,
      engineDisplacementNumber: 1,
      steering: 1,
      driveType: 1,
      images: 1,
      carName: 1,
      fobPrice: 1,
      regYear: 1,
      engineDisplacement: 1,
      referenceNumber: 1,
      mileage: 1,
      stockID: 1,
      keywords: 1,
      dimensionCubicMeters: 1,
      fobPriceNumber: 1,
      isRecommended: 1,
      fobHistory: 1,
      isSale: 1,
      subBodyType: 1,
      // …and any feature flags you render in the UI…
    };


    const docs = await vehicleColl
      .find(filter, { projection, maxTimeMS: 1800 }) // <- remove allowDiskUse; keep maxTimeMS
      .sort({ [sortField]: sortOrder, _id: sortOrder })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage + 1) // +1 to compute hasMore without depending on count
      .toArray();
    // 5) Map to Firestore shape: { id, ...data }
    const hasMore = docs.length > itemsPerPage;
    if (hasMore) docs.pop();

    const totalCount = await countPromise; // may be null if timed out

    const products = docs.map(({ _id, ...data }) => ({ id: _id, ...data }));
    return { products, totalCount: totalCount ?? -1, hasMore, currentPage: page };
  },

  {
    revalidate: 60, // Keep the revalidation period
    tags: ['products-by-page'], // Use a simple, static tag for this group of cached data
  }
);

// const color = 'Pearl'


// export async function fetchCarDataAdmin(carId) {
//   try {
//     const snapshot = await db.collection("VehicleProducts").doc(carId).get();
//     if (!snapshot.exists) {
//       return null; // not found
//     }
//     return snapshot.data();
//   } catch (err) {
//     console.error("Error fetching vehicle data:", err);
//     // If you want network/SDK errors to surface as 500s, rethrow:
//     throw err;
//     // Otherwise, to collapse all errors into a 404, you could return null here instead.
//   }
// }

export const fetchCarDataAdmin = cache(
  async (carId) => {
    console.log(`Cache MISS: Fetching carId ${carId} from Firestore.`); //Check logs

    try {
      const snapshot = await db.collection("VehicleProducts")
        .doc(carId)
        .get();

      if (!snapshot.exists) {
        return null;
      }

      //Important: Return the ID along with the data
      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      //It's often better to return null or an empty object on error
      //to prevent a cached error from breaking the page repeatedly
      return null
    }
  },
  {
    revalidate: 3600,
    tags: ['products']
  }
)

// export async function fetchCurrency() {
//   try {
//     const currencyDocRef = db.collection('currency').doc('currency');
//     const snapshot = await currencyDocRef.get();
//     if (!snapshot.exists) {
//       throw new Error('Currency not found');
//     };
//     return snapshot.data();
//   } catch (error) {
//     console.error('Error fetching currency data:', error);
//     throw error;

//   }
// };

export const fetchCurrency = cache(
  async () => {
    console.log('Cache MISS: Fetching currency data from Firestore.')

    try {
      const currencyDocRef = db.collection('currency').doc('currency');
      const snapshot = await currencyDocRef.get();

      if (!snapshot.exists) {
        console.error('Currency document not found!');
        return null;
      };

      return snapshot.data();
    } catch (error) {
      console.error('Error fetching currency data:', error)

      return null;
    }
  },
  {
    revalidate: 3600,
    tags: ['static-data', 'currency']
  }
)


export async function fetchInspection(selectedPort) {
  try {
    // Reference Firestore document (using admin SDK style)
    const portDocRef = db.collection('CustomerCountryPort').doc('PortsDoc');
    const docSnapshot = await portDocRef.get();

    if (!docSnapshot.exists) {
      console.log("PortsDoc does not exist!");
      return null;
    }

    const portsData = docSnapshot.data();
    const selectedPortData = portsData[selectedPort];

    if (!selectedPortData) {
      console.log(`No data found for port: ${selectedPort}`);
      return null;
    }

    // Return the profitPrice (or the entire port data if needed)
    return selectedPortData
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return null;
  }
}


//is has inspection
export async function fetchInspectionToggle(selectedCountry) {
  // If no country is selected, return defaults
  if (!selectedCountry) {
    return { toggle: false, isToggleDisabled: false };
  }

  // Reference to the document in Firestore
  const countriesDocRef = db.collection('CustomerCountryPort').doc('CountriesDoc');

  try {
    const docSnapshot = await countriesDocRef.get();
    if (!docSnapshot.exists) {
      console.log("CountriesDoc does not exist");
      return { toggle: false, isToggleDisabled: false };
    }

    const data = docSnapshot.data();
    const selectedCountryData = data[selectedCountry];

    if (selectedCountryData) {
      let toggle = false;
      let isToggleDisabled = false;
      // Set values based on the inspection requirement
      switch (selectedCountryData.inspectionIsRequired) {
        case "Required":
          toggle = true;
          isToggleDisabled = true;
          break;
        case "Not-Required":
          toggle = false;
          isToggleDisabled = true;
          break;
        case "Optional":
        default:
          isToggleDisabled = false;
          break;
      }

      return {
        toggle,
        isToggleDisabled,
        inspectionIsRequired: selectedCountryData.inspectionIsRequired,
        inspectionName: selectedCountryData.inspectionName,
      };
    } else {
      return { toggle: false, isToggleDisabled: false };
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return { toggle: false, isToggleDisabled: false };
  }
};




