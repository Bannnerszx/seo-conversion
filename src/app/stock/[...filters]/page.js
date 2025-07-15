import { admin } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import CarListings from "../stockComponents/CarListings";
import SearchHeader from "../stockComponents/Pagination";
import { Search } from "lucide-react";
import { fetchCarMakes, fetchVehicleProductsByPage, fetchCarBodytype, fetchCountries, fetchCurrency } from "../../../../services/fetchFirebaseData";
import { isFavorited } from "@/app/actions/actions";
import { SortProvider } from "../stockComponents/sortContext";
import CarFilter from "../stockComponents/CarFilter";
import { notFound } from "next/navigation";
import { DynamicBreadcrumbs } from "@/app/components/Breadcrumbs";
import BannerAwareAside from "../stockComponents/BannerAwareAside";
import BreadCrumbChild from "../stockComponents/BreadCrumbChild";
// Generate dynamic metadata based on filters and searchParams
export async function generateMetadata({ params, searchParams }) {
    const p = await params;
    const filters = await p.filters || [];
    const isRecommended = filters.includes("recommended");
    const isSale = filters.includes("sale");
    // Known makers list
    const makersList = await fetchCarMakes();
    const makerToken = filters.find(f => !["recommended", "sale"].includes(f) && makersList.includes(f.toUpperCase()));
    const modelToken = makerToken ? filters[filters.indexOf(makerToken) + 1] : null;
    const maker = makerToken ? makerToken.toUpperCase() : null;
    const model = modelToken ? modelToken.toUpperCase() : null;

    let title = "REAL MOTOR JAPAN - Car Stock";
    let description = "Browse our used Japanese cars.";

    if (isRecommended && maker) {
        title = `Recommended ${maker} Cars for Sale - REAL MOTOR JAPAN`;
        description = `Browse recommended ${maker} stock. Find top picks from Japan.`;
    } else if (isRecommended) {
        title = `Recommended Japanese Cars for Sale - REAL MOTOR JAPAN`;
        description = `Browse our recommended stock. Top picks from Japan.`;
    } else if (maker && model) {
        title = `Used ${maker} ${model} Cars for Sale - REAL MOTOR JAPAN`;
        description = `Browse our ${maker} ${model} stock. Used Japanese cars.`;
    } else if (maker) {
        title = `Used ${maker} Cars for Sale - REAL MOTOR JAPAN`;
        description = `Browse our ${maker} stock. Used Japanese cars.`;
    } else if (isSale) {
        title = `Discounted Used Japanese Cars for Sale - REAL MOTOR JAPAN`;
        description = `Browse discounted stock. Find discounted picks from Japan.`;
    }

    return { title, description };
}

// Catch-all page for /stock/*
export default async function StockPage({ params, searchParams }) {
    const p = await params;
    const filters = p.filters ?? []    // e.g. ['sale'] or ['recommended'] or []

    const isRecommended = filters.includes("recommended");

    const isSale = filters.includes("sale");

    const segment = filters[0] || 'stock'
    const config = {
        recommended: {
            title: 'Recommended Japanese Used Cars',
            desc: 'Discover high-quality, reliable Japanese vehicles exported worldwide with professional service and competitive prices.',
        },
        sale: {
            title: 'Discounted Used Japanese Cars for Sale',
            desc: 'Find the best deals on Japanese vehicles with transparent pricing and quality assurance.',
        },
        stock: {
            title: 'Current Stock of Japanese Used Cars',
            desc: 'Browse our up-to-date inventory of Japanese used cars ready for immediate shipping.',
        },
    }

    // 3) Pick the correct copy
    const { title, desc } = config[segment] ?? config.stock


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
    const makerIdx = filters.indexOf(makerToken);
    const invalid = filters.filter((f, idx) => {
        // always allow our “flags”
        if (f === "recommended" || f === "sale") return false;

        const up = f.toUpperCase();
        // allow any known maker
        if (carMakesList.includes(up)) return false;

        // allow the one segment immediately after the makerToken (the model)
        if (makerToken && idx === makerIdx + 1) return false;

        // everything else is invalid
        return true;
    });

    if (invalid.length > 0) {
        return notFound();
    }
    const sp = await searchParams
    // Extract searchParams
    const {
        searchKeywords = "",
        bodytype = "",
        limit = "50",
        sort = "dateAdded-asc",
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
        isSale,
    });

    const carFilters = { make: maker, model };
    // Session and favorites with legacy support
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
    const recommendedUrl = filters.includes('recommended')
    const saleUrl = filters.includes('sale')
    return (
        <SortProvider>
            <div className="z-10">

                <div className="flex flex-col lg:flex-row gap-8">
                    <BannerAwareAside>
                        <CarFilter
                            urlMaker={maker}
                            urlModel={model}
                            userEmail={userEmail}
                            isRecommended={isRecommended}
                            isSale={isSale}
                            carFiltersServer={carFilters}
                            carMakes={carMakesList}
                            countryArray={countryArray}
                            carBodytypes={carBodytypes}
                            initialMake={maker}
                            initialModel={model}
                            initialBodyType={bodytype}
                            country={country}
                            port={port}
                            recommendedUrl={recommendedUrl}
                            saleUrl={saleUrl}
                        />
                    </BannerAwareAside>
                    <div className="w-full">
                        <BreadCrumbChild>
                            <DynamicBreadcrumbs maxItems={5} />
                        </BreadCrumbChild>

                        {/* <div className="px-6 mt-24">
                            <DynamicBreadcrumbs maxItems={5} />
                        </div> */}
                        <section className="text-center mt-20">

                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
                            <p className="text-xl text-gray-600 max-w-full mx-auto">
                                {desc}
                            </p>
                        </section>
                        <SearchHeader
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
