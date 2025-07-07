
import Image from "next/image";
import Car from "../components/Car";
export default function HeroBanner({ unsoldVehicleCount }) {

  return (
    <div className="relative w-full overflow-hidden z-10">
      <div className="absolute bottom-16 right-4 z-20 font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-3">
        {/* Car Icon in White Circle with Black Background */}
        <div className="bg-white rounded-full p-2 flex items-center justify-center">
          <Car className="h-20 w-20 max-[768px]:w-10 max-[768px]:h-10 text-black" />
        </div>

        {/* Count + Label stacked */}
        <div className="flex flex-col leading-tight">
          <h1 className="text-white font-bold text-[2rem] md:text-[4rem] tracking-wide text-shadow-custom">
            {unsoldVehicleCount}
          </h1>
          <h2 className="text-[1rem] md:text-[1.5rem] text-shadow-custom text-white">Units Available</h2>
        </div>
      </div>
      <div className="relative w-full h-[720px]">
        <Image
          src="/samplebanner3.webp"
          alt="Hero banner"
          fill
          sizes="(max-width: 720px) 720px, 100vw"
          quality={75}
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-5 flex justify-center items-center">
        <div className="p-4 w-full max-w-[1280px] absolute left-0 md:left-[40px] top-[40px] text-center md:text-left">
          <h1 className="text-white font-bold text-[2rem] md:text-[4rem] tracking-wide text-shadow-custom">
            REAL MOTOR JAPAN
          </h1>
          <p className="text-white font-semibold text-[1rem] md:text-[1.5rem] tracking-wide text-shadow-custom">
            Established in 1979, offers affordable, quality used vehicles sourced in Japan.
          </p>
        </div>
      </div>
    </div>

  );
}