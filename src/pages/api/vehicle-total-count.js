import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodbClient";
const db = await getDb()

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
const codeToId = FEATURES.reduce((m, f) => {
    m[f.code] = f.id;
    return m;
}, {});



export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 1) pull strings from query
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
        minEngineDisplacement = "0",
        maxEngineDisplacement = "0",
        driveType = "",
        steering = "",
        features = "[]",
        isRecommended = "false",
        isSale = "false",
        currency = "1",
    } = req.query;

    // 2) coerce booleans & numbers
    console.log(isRecommended, isSale, 'outside')
    const recommendedFlag = isRecommended === "true";
    const saleFlag = isSale === "true";
    const num = x => {
        const n = Number(x);
        return isNaN(n) ? 0 : n;
    };
    const curr = num(currency);

    // 3) build exactly the same filter
    const filter = { stockStatus: "On-Sale" };

    if (recommendedFlag) filter.isRecommended = true;
    if (saleFlag) filter.isSale = true;

    const lookup = decodeURIComponent(searchKeywords?.replace(/\+/g, ' ') || '')
        .trim()
        .toLowerCase();

    if (lookup) {
        filter.keywords = lookup;
    }
    if (carMakes) filter.make = carMakes;
    if (carModels) filter.model = carModels;
    if (carBodyType) filter.bodyType = carBodyType;
    if (fuelType) filter.fuel = fuelType;
    if (color) filter.exteriorColor = color;
    if (transmission) filter.transmission = transmission;
    if (driveType) {
        filter.driveType = decodeURIComponent(driveType.replace(/\+/g, " "));
    }
    if (steering) filter.steering = steering;

    // numeric ranges
    if (num(minPrice) > 0) {
        filter.fobPriceNumber = { ...(filter.fobPriceNumber || {}), $gte: num(minPrice) / curr };
    }
    if (num(maxPrice) > 0) {
        filter.fobPriceNumber = { ...(filter.fobPriceNumber || {}), $lte: num(maxPrice) / curr };
    }
    if (num(minYear) > 0) {
        filter.regYearNumber = { ...(filter.regYearNumber || {}), $gte: num(minYear) };
    }
    if (num(maxYear) > 0) {
        filter.regYearNumber = { ...(filter.regYearNumber || {}), $lte: num(maxYear) };
    }
    if (num(minMileage) > 0) {
        filter.mileageNumber = { ...(filter.mileageNumber || {}), $gte: num(minMileage) };
    }
    if (num(maxMileage) > 0) {
        filter.mileageNumber = { ...(filter.mileageNumber || {}), $lte: num(maxMileage) };
    }
    if (num(minEngineDisplacement) > 0) {
        filter.engineDisplacementNumber = { ...(filter.engineDisplacementNumber || {}), $gte: num(minEngineDisplacement) };
    }
    if (num(maxEngineDisplacement) > 0) {
        filter.engineDisplacementNumber = { ...(filter.engineDisplacementNumber || {}), $lte: num(maxEngineDisplacement) };
    }

    // feature flags
    let codesArr = [];
    try {
        codesArr = JSON.parse(features);
    } catch { }
    if (Array.isArray(codesArr) && codesArr.length) {
        for (const code of codesArr) {
            const fid = codeToId[Number(code)];
            if (fid) filter[fid] = true;
        }
    }

    // 4) count
    const totalCount = await vehicleColl
        .countDocuments(filter)
        .catch(() => 0);
    console.log(totalCount, 'total count outside')
    return res.status(200).json({ totalCount });
}