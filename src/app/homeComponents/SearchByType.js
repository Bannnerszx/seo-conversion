
import Link from 'next/link';
const SquareGrays = () => {
    return (
        <div className="flex flex-col gap-1 select-none pointer-events-none opacity-50">
            {/* Pattern using CSS gradients to simulate squares */}
            <div
                className="h-2 w-[180px]"
                style={{
                    backgroundImage: 'linear-gradient(90deg, #b9c0ccff 50%, transparent 50%)',
                    backgroundSize: '15px 100%'
                }}
            />
            <div
                className="h-2 w-[180px] ml-[4px]"
                style={{
                    backgroundImage: 'linear-gradient(90deg, #b9c0ccff 50%, transparent 50%)',
                    backgroundSize: '15px 100%'
                }}
            />
        </div>
    );
};

const SearchByType = () => {
    const types = [
        {
            id: '1',
            name: 'Sedan',
            imageUrl:
                'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fcar-types-assets%2Fsedan-color.png?alt=media&token=7ef19286-f1fd-47f0-a6f3-d5f232aa8f0a',
        },
        {
            id: '2',
            name: 'Pickup',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fcar-types-assets%2Fpickup-color.png?alt=media&token=2c630196-6fa2-433f-ad0d-5d9daf8ed151', // 👉 replace with your real URL
        },
        {
            id: '3',
            name: 'SUV',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fcar-types-assets%2Fsuv-color.png?alt=media&token=1e30973d-94f6-43e9-8f6b-9deb22cb8f50', // 👉 replace with your real URL
        },
        {
            id: '4',
            name: 'Hatchback',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fcar-types-assets%2Fhatchback-color.png?alt=media&token=9f689527-9af8-4d19-bd75-a17c2d451ffb', // 👉 replace with your real URL
        },
        {
            id: '5',
            name: 'Wagon',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fcar-types-assets%2Fwagon-color.png?alt=media&token=35d33185-f19d-4a57-b523-48659dfe9d75', // 👉 replace with your real URL
        },
        {
            id: '6',
            name: 'Van/Minivan',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fcar-types-assets%2Fvan-color.png?alt=media&token=02ef9aad-574c-4e1f-90d0-bf7e273c6d7c', // 👉 replace with your real URL
        },
    ];
    return (
        <div className='bg-gradient-to-b from-black to-gray-900'>

            <div className="flex items-center gap-4 px-6 py-4">
                {/* Line */}
                <div className="h-[2px] bg-white flex-1 max-w-[70px] ml-[-25]" />

                {/* Text */}
                <h1 className="text-base text-[30px] font-bold text-white whitespace-nowrap font">Search by Types</h1>

                {/* Squares */}
                <SquareGrays />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 ">
                {types.map((type) => (
                    <Link key={type.id} href={`/stock?bodytype=${encodeURIComponent(type.name)}`}>
                        <div className="rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer">
                            <div className="transition-transform hover:scale-125">
                                <img
                                    src={type.imageUrl}
                                    alt={`${type.name} icon`}
                                    loading="lazy"
                                    className="w-28 h-28 object-cover"
                                />
                            </div>
                            <p className="font-bold text-center mt-2 text-white">
                                {type.name.toUpperCase()}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

        </div>

    )
};

export default SearchByType;