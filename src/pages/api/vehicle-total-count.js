
import { getDb } from "@/lib/mongodbClient";

const db = await getDb();
const vehicleColl = db.collection("VehicleProducts");

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
const codeToId = FEATURES.reduce((map, f) => {
  map[f.code] = f.id;
  return map;
}, {});


export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const {
    searchKeywords = "",
    carMakes = "",
    carModels = "",
    carBodyType = "",
    fuelType = "",
    minPrice = "0",
    maxPrice = "0",
    minYear = "0",
    maxYear = "0",
    minMileage = "0",
    maxMileage = "0",
    color = "",
    transmission = "",
    subBodyType = "",
    minEngineDisplacement = "0",
    maxEngineDisplacement = "0",
    driveType = "",
    steering = "",
    features = "[]",
    isRecommended = "false",
    isSale = "false",
    currency = "1",             // <-- default 1 if absent
    page = "1",
    limit = "20",
    sortField = "dateAdded",
    sortDirection = "asc",
  } = req.query;

  const num = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };

  const pageNum = Math.max(1, num(page));
  const limitNum = Math.max(1, Math.min(50, num(limit))); // hard cap
  const documentsToSkip = (pageNum - 1) * limitNum;

  const recommendedFlag = isRecommended === "true";
  const saleFlag = isSale === "true";
  const curr = num(currency) || 1;                         // <-- use this for price math

  // Build filter
  const filter = { stockStatus: "On-Sale" };
  if (recommendedFlag) filter.isRecommended = true;
  if (saleFlag) filter.isSale = true;

  const lookup = decodeURIComponent(searchKeywords.replace(/\+/g, " "))
    .trim()
    .toLowerCase();
  if (lookup) filter.keywords = lookup;
  if (carMakes) filter.make = carMakes;
  if (carModels) filter.model = carModels;
  if (carBodyType) filter.bodyType = carBodyType;
  if (subBodyType) filter.subBodyType = subBodyType;
  if (fuelType) filter.fuel = fuelType;
  if (color) filter.exteriorColor = color;
  if (transmission) filter.transmission = transmission;
  if (driveType) filter.driveType = decodeURIComponent(driveType.replace(/\+/g, " "));
  if (steering) filter.steering = steering;

  // Numeric ranges (use curr!)
  if (num(minPrice) > 0) filter.fobPriceNumber = { ...(filter.fobPriceNumber || {}), $gte: num(minPrice) / curr };
  if (num(maxPrice) > 0) filter.fobPriceNumber = { ...(filter.fobPriceNumber || {}), $lte: num(maxPrice) / curr };
  if (num(minYear) > 0) filter.regYearNumber = { ...(filter.regYearNumber || {}), $gte: num(minYear) };
  if (num(maxYear) > 0) filter.regYearNumber = { ...(filter.regYearNumber || {}), $lte: num(maxYear) };
  if (num(minMileage) > 0) filter.mileageNumber = { ...(filter.mileageNumber || {}), $gte: num(minMileage) };
  if (num(maxMileage) > 0) filter.mileageNumber = { ...(filter.mileageNumber || {}), $lte: num(maxMileage) };
  if (num(minEngineDisplacement) > 0)
    filter.engineDisplacementNumber = { ...(filter.engineDisplacementNumber || {}), $gte: num(minEngineDisplacement) };
  if (num(maxEngineDisplacement) > 0)
    filter.engineDisplacementNumber = { ...(filter.engineDisplacementNumber || {}), $lte: num(maxEngineDisplacement) };

  // Feature flags
  const FEATURES = [
    { id: "SafetySystemAnBrSy", code: 1 }, { id: "SafetySystemDrAi", code: 2 }, { id: "SafetySystemPaAi", code: 3 },
    { id: "SafetySystemSiAi", code: 4 }, { id: "InteriorPoWi", code: 5 }, { id: "InteriorReWiDe", code: 6 },
    { id: "InteriorReWiWi", code: 7 }, { id: "InteriorTiGl", code: 8 }, { id: "ComfortAiCoFr", code: 9 },
    { id: "ComfortAiCoRe", code: 10 }, { id: "ComfortCrSpCo", code: 11 }, { id: "ComfortNaSyGPS", code: 12 },
    { id: "ComfortPoSt", code: 13 }, { id: "ComfortReKeSy", code: 14 }, { id: "ComfortTiStWh", code: 15 },
    { id: "ComfortDiSp", code: 16 }, { id: "ComfortAMFMRa", code: 17 }, { id: "ComfortAMFMSt", code: 18 },
    { id: "ComfortCDCh", code: 19 }, { id: "ComfortCDPl", code: 20 }, { id: "ComfortPrAuSy", code: 21 },
    { id: "ComfortDVDPl", code: 22 }, { id: "ComfortHDD", code: 23 }, { id: "InteriorLeSe", code: 24 },
    { id: "InteriorPoSe", code: 25 }, { id: "ExteriorAlWh", code: 26 }, { id: "InteriorPoDoLo", code: 27 },
    { id: "InteriorPoMi", code: 28 }, { id: "ExteriorSuRo", code: 29 }, { id: "InteriorThRoSe", code: 30 },
    { id: "ExteriorPoSlDo", code: 31 }, { id: "SellingPointsCuWh", code: 32 }, { id: "SellingPointsFuLo", code: 33 },
    { id: "SellingPointsMaHiAv", code: 34 }, { id: "SellingPointsReBo", code: 35 }, { id: "SellingPointsBrNeTi", code: 36 },
    { id: "SellingPointsNoAcHi", code: 37 }, { id: "SellingPointsOnOwHi", code: 38 }, { id: "SellingPointsPeRaTi", code: 39 },
    { id: "SellingPointsUpAuSy", code: 40 }, { id: "SellingPointsNoSmPrOw", code: 41 }, { id: "SellingPointsTuEn", code: 42 },
  ];
  const codeToId = FEATURES.reduce((m, f) => ((m[f.code] = f.id), m), {});

  let codesArr = [];
  if (Array.isArray(features)) {
    codesArr = features.map((x) => Number(x)).filter((x) => !isNaN(x));
  } else if (typeof features === "string") {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) codesArr = parsed.map((x) => Number(x)).filter((x) => !isNaN(x));
      else throw new Error("not array");
    } catch {
      codesArr = features.split(",").map((x) => Number(x.trim())).filter((x) => !isNaN(x));
    }
  }
  for (const code of codesArr) {
    const fid = codeToId[code];
    if (fid) filter[fid] = true;
  }

  // Sort (stable + index-friendly)
  const allowedSortFields = new Set(["dateAdded", "fobPriceNumber", "regYearNumber", "mileageNumber"]);
  const effectiveSortField = allowedSortFields.has(sortField) ? sortField : "dateAdded";
  const sortOrder = sortDirection === "asc" ? 1 : -1;
  const sort = { [effectiveSortField]: sortOrder, _id: sortOrder };

  // --- Performance knobs ---
  const COUNT_TIMEOUT_MS = 900;
  const FIND_TIMEOUT_MS = 1800;

  // Count only on first page; otherwise set to -1 (or do a background job if you like)
  const countPromise = pageNum === 1
    ? vehicleColl.countDocuments(filter, { maxTimeMS: COUNT_TIMEOUT_MS }).catch(() => -1)
    : Promise.resolve(-1);

  // Optional: projection to reduce payload (uncomment & adjust if safe for your UI)
  // const projection = { _id: 1, carName: 1, images: 1, fobPriceNumber: 1, regYearNumber: 1, mileageNumber: 1, dateAdded: 1, bodyType: 1, make: 1, model: 1 };

  // Fetch page (+1 to compute hasMore without relying on count)
  const docs = await vehicleColl
    .find(filter, { /* projection, */ maxTimeMS: FIND_TIMEOUT_MS })
    .sort(sort)
    .skip(documentsToSkip)
    .limit(limitNum + 1)
    .toArray();

  const hasMore = docs.length > limitNum;
  if (hasMore) docs.pop();

  const totalCount = await countPromise;

  return res.status(200).json({ totalCount, hasMore, vehicles: docs });
}

