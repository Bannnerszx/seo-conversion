'use server'
import { admin } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import CarListings from "./stockComponents/CarListings";
import SearchHeader from "./stockComponents/Pagination";
import {
    fetchCarMakes,
    fetchVehicleProductsByPage,
    fetchCarBodytype,
    fetchCountries,
    fetchCurrency,
} from "../../../services/fetchFirebaseData";
import { isFavorited } from "../actions/actions";
import { SortProvider } from "./stockComponents/sortContext";
import CarFilter from "./stockComponents/CarFilter";

import { DynamicBreadcrumbs } from "../components/Breadcrumbs";
import BannerAwareAside from "./stockComponents/BannerAwareAside";
import BreadCrumbChild from "./stockComponents/BreadCrumbChild";

// In-memory cursor map (Note: not SSR-safe, use in client or persist elsewhere)
export async function generateMetadata({ params, searchParams }) {
    // 1) fetch your look-ups in parallel
    const [carMakes, carBodytypes, countryArray, currency] = await Promise.all([
        fetchCarMakes(),
        fetchCarBodytype(),
        fetchCountries(),
        fetchCurrency(),
    ]);
    const paramsAwaited = await params
    // 2) pull and decode your dynamic route params (no await needed)
    const makerRaw = await paramsAwaited.maker ?? "";
    const modelRaw = await paramsAwaited.model ?? "";
    const keywordsRaw = await paramsAwaited.keyword ?? "";
    const maker = decodeURIComponent(makerRaw);
    const model = decodeURIComponent(modelRaw);
    const keywords = decodeURIComponent(keywordsRaw);
    // 3) destructure your query params directly (they’re already a plain object)
    const {
        searchKeywords = "",
        bodytype = "",
        limit = "50",
        sort = "dateAdded-desc",
        page = "1",
        country = "",
        port = "",
        minPrice = "0",
        maxPrice = "0",
        minYear = "0",
        maxYear = "0",
        minMileage = "0",
        maxMileage = "0",
    } = await searchParams;

    // 4) parse anything that needs to be a number
    const pageNumber = parseInt(page, 10);
    const itemsPerPage = parseInt(limit, 10);
    const numericMinPrice = parseInt(minPrice, 10);
    const numericMaxPrice = parseInt(maxPrice, 10);
    const numericMinYear = parseInt(minYear, 10);
    const numericMaxYear = parseInt(maxYear, 10);
    const numericMinMileage = parseInt(minMileage, 10);
    const numericMaxMileage = parseInt(maxMileage, 10);

    // 5) split your sort
    const [sortField, sortDirection] = sort.split("-");

    // 6) call your API
    const { products, totalCount } = await fetchVehicleProductsByPage({
        searchKeywords: searchKeywords ? searchKeywords.toLowerCase() : null,
        carMakes: maker ? maker.toUpperCase() : null,
        carModels: model ? model.toUpperCase() : null,
        carBodyType: bodytype,
        sortField,
        sortDirection,
        itemsPerPage,
        page: pageNumber,
        minPrice: numericMinPrice,
        maxPrice: numericMaxPrice,
        minYear: numericMinYear,
        maxYear: numericMaxYear,
        minMileage: numericMinMileage,
        maxMileage: numericMaxMileage,
        currency: currency.jpyToUsd,
    });


    // 7) build your metadata
    const title = bodytype ? `Used Japanese ${bodytype} for Sale - REAL MOTOR JAPAN` : `Car Stock (${totalCount.toLocaleString() ?? 0} units) - REAL MOTOR JAPAN`


    const description = `Browse our stock. Used Japanese Cars`


    return { title, description };
}

const CarStock = async ({ params, searchParams }) => {
    const p = await params;
    const filters = await p.filters || [];
    const isRecommended = filters.includes("recommended");
    const isRecommendedBool = Boolean(filters.includes("recommended"));
    const isOnSale = filters.includes("sale");
    const isOnSaleBool = Boolean(filters.includes("sale"));

    // Fetch lookups
    const [carMakesList, carBodytypes, countryArray, currency] = await Promise.all([
        fetchCarMakes(),
        fetchCarBodytype(),
        fetchCountries(),
        fetchCurrency(),
    ]);

    // Extract maker/model
    const makerToken = filters.find(f => !["recommended", "sale"].includes(f) && carMakesList.includes(f.toUpperCase()));
    const modelToken = makerToken ? filters[filters.indexOf(makerToken) + 1] : null;

    const maker = makerToken ? decodeURIComponent(makerToken).toUpperCase() : null;
    const model = modelToken ? decodeURIComponent(modelToken).toUpperCase() : null;
    const sp = await searchParams
    // Extract searchParams
    const {
        searchKeywords = "",
        bodytype = "",
        subBodyType = "",
        limit = "50",
        sort = "dateAdded-desc",
        page = "1",
        country = "",
        port = "",
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
        features = "",
        fuelType = ""
    } = sp;
    const pageNumber = parseInt(page, 10);
    const [sortField, sortDirection] = sort.split("-");

    // Fetch products
    const { products, totalCount } = await fetchVehicleProductsByPage({
        searchKeywords: searchKeywords.toLowerCase(),
        carMakes: maker || null,
        carModels: model || null,
        carBodyType: bodytype,
        subBodyType: subBodyType,
        sortField,
        sortDirection,
        itemsPerPage: Number(limit),
        page: pageNumber,
        minPrice: Number(minPrice),
        maxPrice: Number(maxPrice),
        minYear: Number(minYear),
        maxYear: Number(maxYear),
        minMileage: Number(minMileage),
        maxMileage: Number(maxMileage),
        currency: currency.jpyToUsd,
        color,
        transmission,
        minEngineDisplacement: Number(minEngineDisplacement),
        maxEngineDisplacement: Number(maxEngineDisplacement),
        driveType,
        steering,
        features,
        fuelType,
        isRecommended,
        isOnSale,
    });

    const carFilters = { make: maker, model };

    const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || "";
    const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session_v2";
    const oldNames = OLD_NAMES_ENV.split(",").map(n => n.trim()).filter(Boolean);
    const cookieStore = await cookies();
    let userEmail = null;
    let resultsIsFavorited = [];

    // 1) If any legacy cookie exists, viewport as guest
    for (const legacyName of oldNames) {
        if (cookieStore.get(legacyName)?.value) {
            // guest defaults
            userEmail = null;
            resultsIsFavorited = [];
            break;
        }
    }

    // 2) Read only the current cookie
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    // 3) Verify session if current cookie exists
    if (sessionCookie) {
        try {
            const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
            userEmail = decoded.email || null;
            resultsIsFavorited = await isFavorited({ userEmail });
        } catch {
            // remain guest
            userEmail = null;
            resultsIsFavorited = [];
        }
    }
    // true or false
    // Render with correct userEmail
    const context = 'query'
    return (
        <SortProvider>
            <div className={`z-10`}>
                <div className="flex flex-col lg:flex-row gap-8">
                    <BannerAwareAside>
                        <CarFilter
                            currency={currency?.jpyToUsd}
                            userEmail={userEmail}
                            isRecommended={isRecommended}
                            carFiltersServer={carFilters}
                            carMakes={carMakesList}
                            countryArray={countryArray}
                            carBodytypes={carBodytypes}
                            initialMake={maker}
                            initialModel={model}
                            initialBodyType={bodytype}
                            country={country}
                            port={port}
                            totalCount={totalCount}
                        />
                    </BannerAwareAside>

                    <div className="w-full">
                        <BreadCrumbChild>
                            <DynamicBreadcrumbs maxItems={5} />
                        </BreadCrumbChild>

                        <section className="text-center mt-20">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">All Japanese Used Cars</h1>
                            <p className="text-xl text-gray-600 max-w-full mx-auto">
                                Browse our up-to-date inventory of Japanese used cars ready for immediate shipping.
                            </p>
                        </section>
                        <SearchHeader
                        context={context}
                            totalCount={totalCount}
                            initialLimit={Number(limit)}
                            products={products}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            currency={currency}
                            currentPage={pageNumber}
                            country={country}
                            port={port}
                            userEmail={userEmail}
                            carMakes={carMakesList}
                            carBodytypes={carBodytypes}
                            countryArray={countryArray}
                        >
                            <CarListings
                                resultsIsFavorited={resultsIsFavorited}
                                products={products}
                                currency={currency}
                                country={country}
                                port={port}
                                userEmail={userEmail}
                            />
                        </SearchHeader>
                    </div>

                </div>
            </div>
        </SortProvider>
    );
}


export default CarStock;