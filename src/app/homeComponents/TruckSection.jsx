import { m } from "framer-motion"

const truckTypes = [
    {
        id: 1,
        name: "Dump",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fdump%20truck.png?alt=media&token=2931d2bf-a991-4f0e-aa0a-c2f23b027c97"
    },
    {
        id: 2,
        name: "Flat Body",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fflat%20body.png?alt=media&token=41ca5d0d-58e7-4bd0-af6e-8838d3fd26e0"
    },
    {
        id: 3,
        name: "Aluminum Van",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Faluminum%20van.png?alt=media&token=a4145989-25f2-466d-be3b-28d875b803f5"
    },
    {
        id: 4,
        name: "Aluminum Wing",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fwing%20body%20truck.png?alt=media&token=071db0f0-a07c-425c-8cd1-63801e2d447c"
    },
    {
        id: 5,
        name: "Crane",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fcrane%20truck.png?alt=media&token=339f3e77-2104-4969-b083-7604c906faeb"
    },
    {
        id: 6,
        name: "Hook Lift",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fhooklift%20truck.png?alt=media&token=65504f40-810b-492f-b4d4-bf95b701197c"
    },
    {
        id: 7,
        name: "Garbage Truck",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fpacker.png?alt=media&token=7c713559-5ccb-4242-96d2-17b9d4c7f5eb"
    },
    {
        id: 8,
        name: "Mixer Truck",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fmixer%20truck.png?alt=media&token=34e01228-41c2-4c81-a94d-09d08ff64378"
    },
    {
        id: 9,
        name: "Refrigerated Van",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Frefrigerated%20truck.png?alt=media&token=f05b9683-41de-43fb-8a0d-2f55c0759810"
    },
    {
        id: 10,
        name: "Aerial Platform",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Faerial%20work%20platform.png?alt=media&token=ef3f4de2-c9e2-4a98-bf95-a416605e16bb"
    },
    {
        id: 11,
        name: "Self Loader",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fcacrrier.png?alt=media&token=0c43544d-7db5-45b9-bbc5-2717cea1b3fd"
    },
    {
        id: 12,
        name: "Other Trucks",
        image: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Ftruck-assets%2Fbus.png?alt=media&token=519013c2-2b2a-4c61-87f3-69969b5e0889"
    }
]

export default function TruckIconsSection() {
    return (
        <section className="w-full bg-white py-8 px-4 md:py-10 lg:py-12">
            <div className="mx-auto ">
                <div className="mb-6 text-center md:mb-8">
                    <h2 className="text-xl font-bold text-gray-900 md:text-2xl lg:text-3xl">
                        Search by Truck Types
                    </h2>
                </div>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
                    {truckTypes.map((truck) => (
                        <button
                            key={truck.id}
                            className="group flex flex-col items-center gap-2 rounded-lg border
                            border-gray-200 bg-white p-3 transition-all hover:border-blue-600 hover:shadow-md md:p-4
                            "
                        >
                            <div className="group flex h-24 w-24 items-center justify-center rounded-full bg-transparent transition-transform">
                                <img
                                    src={truck.image || '/placeholder.svg'}
                                    alt={`${truck.name} icon`}
                                    className="h-20 w-20 object-contain transition-transform group-hover:scale-125"
                                />
                            </div>


                            <div className="text-center">
                                <span className="block text-xs font-semibold text-gray-900 leading-right md:text-sm">
                                    {truck.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}
