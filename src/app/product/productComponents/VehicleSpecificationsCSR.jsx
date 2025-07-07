import React from "react";

export default function VehicleSpecifications({ carData }) {
    return (
        <div className="max-w-screen-2xl mx-auto p-4 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Full Vehicle Specifications */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Full Vehicle Specifications</h2>
                    <div className="border-t border-gray-200">
                        <div className="grid grid-cols-1">
                            <SpecRow label="Make" value={carData.make || ''} />
                            <SpecRow label="Model" value={carData.model || ''} />
                            <SpecRow label="Registration Year" value={`${carData.regYear || ''} / ${carData.regMonth || ''}`} />
                            <SpecRow label="Reference Number" value={carData.referenceNumber || ''} />
                            <SpecRow label="Chassis/Frame Number" value={carData.chassisNumber || ''} />
                            <SpecRow label="Model Code" value={carData.modelCode || ''} />
                            <SpecRow label="Engine Displacement (cc)" value={`${carData.engineDisplacement || ''} cc`} />
                            <SpecRow label="Steering" value={carData.steering || ''} />
                            <SpecRow label="Mileage" value={carData.mileage || ''} />
                            <SpecRow label="Transmission" value={carData.transmission || ''} />
                            <SpecRow label="External Color" value={carData.exteriorColor || ''} />
                            <SpecRow label="Number of Seats" value={carData.numberOfSeats || ''} />
                            <SpecRow label="Doors" value={carData.doors || ''} />
                            <SpecRow label="Fuel" value={carData.fuel || ''} />
                            <SpecRow label="Drive Type" value={carData.driveType || ''} />
                            <SpecRow label="Dimension"
                                value={`${carData.dimensionLength || ''}cm x ${carData.dimensionWidth || ''}cm x ${carData.dimensionHeight || ''}cm (${carData.dimensionCubicMeters || ''}m³)`}
                            />
                            <SpecRow label="Body Type" value={carData.bodyType || ''} />

                        </div>
                    </div>
                </div>

                {/* Right Column - Features */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Features</h2>

                    </div>

                    {/* Safety System */}
                    <FeatureSection title="Safety System" features={[
                        { name: "Anti-Lock Braking System (ABS)", active: carData.SafetySystemAnBrSy || false },
                        { name: "Driver Airbag", active: carData.SafetySystemDrAi || false },
                        { name: "Passenger Airbag", active: carData.SafetySystemPaAi || false },
                        { name: "Safety Airbag", active: carData.SafetySystemSiAi || false },
                    ]} />

                    {/* Comfort */}
                    <FeatureSection title="Comfort" features={[
                        { name: "Air Conditioner (Front)", value: carData.ComfortAiCoFr || false },
                        { name: "Air Conditioner (Rear)", value: carData.ComfortAiCoRe || false },
                        { name: "AM/FM Radio", value: carData.ComfortAMFMRa || false },
                        { name: "AM/FM Stereo", value: carData.ComfortAMFMSt || false },
                        { name: "CD Player", value: carData.ComfortCDPl || false },
                        { name: "CD Changer", value: carData.ComfortCDCh || false },
                        { name: "Cruise Speed Control", value: carData.ComfortCrSpCo || false },
                        { name: "Digital Speedometer", value: carData.ComfortDiSp || false },
                        { name: "DVD Player", value: carData.ComfortDVDPl || false },
                        { name: "Hard Disk Drive", value: carData.ComfortHDD || false },
                        { name: "Navigation System (GPS)", value: carData.ComfortNaSyGPS || false },
                        { name: "Power Steering", value: carData.ComfortPoSt || false },
                        { name: "Premium Audio System", value: carData.ComfortPrAuSy || false },
                        { name: "Remote Keyless System", value: carData.ComfortReKeSy || false },
                        { name: "Tilt Steering Wheel", value: carData.ComfortTiStWh || false },

                    ]} />

                    {/* Interior */}
                    <FeatureSection title="Interior" features={[
                        { name: "Leather Seats", value: carData.InteriorLeSe || false },
                        { name: "Power Door Locks", value: carData.InteriorPoDoLo || false },
                        { name: "Power Mirrors", value: carData.InteriorPoMi || false },
                        { name: "Power Seats", value: carData.InteriorPose || false },
                        { name: "Power Windows", value: carData.InteriorPoWi || false },
                        { name: "Rear Window Defroster", value: carData.InteriorReWiDe || false },
                        { name: "Rear Window Wiper", value: carData.InteriorReWiWi || false },
                        { name: "Third Row Seats", value: carData.InteriorThRoSe || false },
                        { name: "Tinted Glass", value: carData.InteriorTiGl || false },
                    ]} />

                    {/* Exterior */}
                    <FeatureSection title="Exterior" features={[
                        { name: "Alloy Wheels", value: carData.ExteriorAlWh || false },
                        { name: "Power Sliding Door", value: carData.ExteriorPoSlDo || false },
                        { name: "Sunroof", value: carData.ExteriorSuRo || false },

                    ]} />

                    {/* Selling Points */}
                    <FeatureSection title="Selling Points" features={[
                        { name: "Customized Wheels", value: carData.SellingPointsCuWh || false },
                        { name: "Fully Loaded", value: carData.SellingPointsFuLo || false },
                        { name: "Maintenance History Available", value: carData.SellingPointsMaHiAv || false },
                        { name: "Brand New Tires", value: carData.SellingPointsBrNeTi || false },
                        { name: "No Accident History", value: carData.SellingPointsNoAcHi || false },
                        { name: "Non-Smoking Previous Owner", value: carData.SellingPointsNoSmPrOw || false },
                        { name: "One Owner History", value: carData.SellingPointsOnOwHi || false },
                        { name: "Performance-Rated Tires", value: carData.SellingPointsPeRaTi || false },
                        { name: "Repainted Body", value: carData.SellingPointsReBo || false },
                        { name: "Turbo Engine", value: carData.SellingPointsTuEn || false },
                        { name: "Upgraded Audio System", value: carData.SellingPointsUpAuSy || false }
                    ]} />
                </div>
            </div>
        </div>
    );
}

// Component for specification rows
function SpecRow({ label, value }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-[#454545] text-white p-3">{label}</div>
            <div className="border border-gray-300 p-3">{value}</div>
        </div>
    );
}

// Component for feature sections
function FeatureSection({ title, features }) {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {features.map((feature, index) => (
                    <FeatureCard key={index} active={feature.active}>{feature.name}</FeatureCard>
                ))}
            </div>
        </div>
    );
}

// Component for feature cards
function FeatureCard({ children, active }) {
    return (
        <div
            className={`p-2 text-center text-sm border flex-1 flex items-center justify-center ${active ? "bg-[#454545] text-white" : "bg-white text-gray-700 border-gray-200"
                }`}
        >
            {children}
        </div>
    );
}
