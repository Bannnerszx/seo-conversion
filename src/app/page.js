import { fetchNewVehicle, fetchCarMakes, fetchCarBodytype, fetchCurrency, fetchTestimonies, fetchHomepageStock, getUnsoldVehicleCount } from '../../services/fetchFirebaseData'; // Ensure you use the cached versions we made!
import { getMakeCounts } from './actions/actions';
import dynamic from 'next/dynamic'; // 1. Import dynamic

// 2. Keep "Above the Fold" components as standard imports (Critical for LCP)
import HeroBanner from './homeComponents/HeroBanner';
import SearchQuery from './homeComponents/SearchQuery';
import MobileSignupBanner from './homeComponents/mobileSignUpBanner';
import DesktopSignUpBanner from './homeComponents/desktopSignUpBanner';

// 3. Lazy Load everything else (Drastically reduces initial bundle size)
const NewArrivals = dynamic(() => import('./homeComponents/NewArrivals'));
const HowToBuySection = dynamic(() => import('./homeComponents/HowToBuySection'));
import DynamicMap from './homeComponents/DynamicMap'; // 👈 Import the new wrapper
const SearchByMakers = dynamic(() => import('./homeComponents/SearchbyMakers'));
const SearchByType = dynamic(() => import('./homeComponents/SearchByType'));
const RecommendedSection = dynamic(() => import('./homeComponents/RecommendedSection'));
const ZambiaBranchSection = dynamic(() => import('./homeComponents/ZambiaBranchSection'));
const TestimonialsSection = dynamic(() => import('./homeComponents/TestimonialsSection'));
const TruckIconsSection = dynamic(() => import('./homeComponents/TruckSection'));
const ClientWrapper = dynamic(() => import('./homeComponents/ClientWrapper'));
const SignupBanner = dynamic(() =>
  import('./components/SignUpBanner').then((mod) => mod.SignupBanner)
);


// generateMetadata is only for SEO metadata
export async function generateMetadata() {

  return {
    title: `Japanese Used Cars for Sale - REAL MOTOR JAPAN`,
    description:
      "Established in 1979, offering affordable and quality used vehicles sourced in Japan.",
    openGraph: {
      title: "REAL MOTOR JAPAN",
      description:
        "Affordable, quality used vehicles sourced in Japan since 1979.",
      images: [
        {
          url: `https://www.realmotor.jp/rmj.webp`,
          width: 1200,
          height: 630,
          alt: "REAL MOTOR JAPAN Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "REAL MOTOR JAPAN",
      description:
        "Affordable, quality used vehicles sourced in Japan since 1979.",
      images: [`https://www.realmotor.jp/rmj.webp`],
    },
  };
}




export default async function Home() {

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": "REAL MOTOR JAPAN",
    "url": 'https://dev.realmotor.jp',
    "logo": "https://dev.realmotor.jp/rmj.webp",
    "image": "https://dev.realmotor.jp/rmj.webp",
    "description": "Established in 1979, offering affordable and quality used vehicles sourced in Japan.",
    "foundingDate": "1979",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Nishihaiagari-5-2 Kamiokacho",
      "addressLocality": "Toyota City",
      "addressRegion": "Aichi",
      "postalCode": "473-0931",
      "addressCountry": "JP"
    },
    "telephone": "+81-565-85-0602",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "priceRange": "$$",
    "sameAs": [
      "https://www.facebook.com/RealMotorJP",
      "https://www.instagram.com/realmotorjp/"
    ]
  }


  const brandNames = ['TOYOTA', 'NISSAN', 'HONDA', 'MITSUBISHI', 'MERCEDES-BENZ', 'BMW', 'SUZUKI', 'SUBARU', 'VOLKSWAGEN', 'MAZDA'];

  const [
    newVehicles,
    carMakes,
    carBodytypes,
    currency,
    entries,
    unsoldVehicleCount,
    homepageData
  ] = await Promise.all([
    fetchNewVehicle(),
    fetchCarMakes(),
    fetchCarBodytype(),
    fetchCurrency(),
    Promise.all(
      brandNames.map(name =>
        getMakeCounts(name).then(count => [name, count])
      )
    ),
    getUnsoldVehicleCount(), // Uses the new cached version
    fetchHomepageStock()
  ]);
  // build { TOYOTA: 42, NISSAN: 17, … }
  const makeCounts = Object.fromEntries(entries);
  const testimonies = await fetchTestimonies();
  const { products, totalCount } = homepageData

  return (
    <div className="relative z-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <MobileSignupBanner />

      <div className="relative z-10">
        {/* Hero banner stays here */}
        <HeroBanner unsoldVehicleCount={unsoldVehicleCount} />

        <DesktopSignUpBanner />


        {/* horizontal – only visible below md */}

      </div>

      <div className="relative z-[8000]">
        <SearchQuery carMakes={carMakes} carBodytypes={carBodytypes} />
      </div>
      <div className="relative w-full">
        <div className="flex justify-evenly items-center overflow-x-auto whitespace-nowrap px-4 py-4 w-full">
          <a
            href="#by-makers"
            className="font-semibold text-[16px] mx-4 hover:underline"
          >
            By Makers
          </a>
          <div className="h-[16px] w-[2px] bg-black mx-4" />
          <a
            href="#by-types"
            className="font-semibold text-[16px] mx-4 hover:underline"
          >
            By Types
          </a>
          <div className="h-[16px] w-[2px] bg-black mx-4" />
          <a
            href="#new-arrivals"
            className="font-semibold text-[16px] mx-4 hover:underline"
          >
            New Arrivals
          </a>
          <div className="h-[16px] w-[2px] bg-black mx-4" />
          <a
            href="#how-to-buy"
            className="font-semibold text-[16px] mx-4 hover:underline"
          >
            How to Buy
          </a>
        </div>

        <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      </div>

      <ClientWrapper id="by-makers">
        <div id="by-makers" className="relative z-25">
          <SearchByMakers makeCounts={makeCounts} />
        </div>
      </ClientWrapper>

      <ClientWrapper id="by-types">
        <div id="by-types" className="relative z-40">
          <SearchByType />
        </div>
      </ClientWrapper>

      <ClientWrapper id="by-trucks">
        <div id="by-types" className="relative z-40">
          <TruckIconsSection />
        </div>
      </ClientWrapper>

      <ClientWrapper id="testimonials">
        <div id="testimonials" className="relative z-40">
          <TestimonialsSection testimonials={testimonies} />
        </div>
      </ClientWrapper>

      <ClientWrapper id="new-arrivals">
        <div id="new-arrivals" className="relative z-50">
          <NewArrivals newVehicles={newVehicles} currency={currency} />
        </div>
      </ClientWrapper>
      {/* <ClientWrapper id="recommended">
        <div id="new-arrivals" className="relative z-50">
          <RecommendedSection newVehicles={newVehicles} currency={currency} />
        </div>
      </ClientWrapper>

      <ClientWrapper id="new-arrivals">
        <div id="new-arrivals" className="relative z-50">
          <NewArrivals newVehicles={newVehicles} currency={currency} />
        </div>
      </ClientWrapper> */}
      <ClientWrapper id="how-to-buy">
        <div id="how-to-buy" className="relative z-60">
          <HowToBuySection />
        </div>
      </ClientWrapper>

      <ClientWrapper id="world-map">
        <div id="world-map" className="relative z-70 p-4">
          <DynamicMap />
        </div>
        <div id="zambia-section" className="relative z-80 p-4">
          <ZambiaBranchSection />
        </div>
        <div className="space-y-4 mx-auto w-full max-w-7xl mb-4">
          <SignupBanner
            variant="compact"
            title="Export Cars from Japan - We Handle Everything"
            subtitle="Professional negotiation, inspection, and shipping. Get the best Japanese cars at wholesale prices."
            buttonText="Sign Up Now"
            className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-amber-300"
            buttonHref="/signup"
            features={["Expert negotiation", "Full inspection service", "Quality inspection", "Best prices guaranteed"]}

          />
        </div>
      </ClientWrapper>
    </div>
  );
}
