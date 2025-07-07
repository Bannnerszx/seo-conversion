import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserPlus, Car, MessageSquare, CreditCard, Truck } from "lucide-react"
const SquareGrays = () => {
  const createOddRowOfSquares = () =>
    Array.from({ length: 20 }, (_, index) => (
      <div
        key={`odd-${index}`}
        className={`w-2 h-2 ${index % 2 === 0 ? 'bg-gray-400' : 'bg-transparent'} ml-[1px]`}
      />
    ));

  const createEvenRowOfSquares = () =>
    Array.from({ length: 20 }, (_, index) => (
      <div
        key={`even-${index}`}
        className={`w-2 h-2 ${index % 2 !== 0 ? 'bg-gray-400' : 'bg-transparent'} ml-[1px]`}
      />
    ));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-center">{createOddRowOfSquares()}</div>
      <div className="flex items-center justify-center">{createEvenRowOfSquares()}</div>
    </div>
  );
};
export default function HowToBuy() {
  return (
    <div className='bg-black'>
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Line */}
        <div className="h-[2px] bg-white flex-1 max-w-[70px] ml-[-25]" />

        {/* Text */}
        <h1 className="text-base text-[30px] font-bold text-white whitespace-nowrap font">How To Buy</h1>

        {/* Squares */}
        <SquareGrays />
      </div>
      <section className="text-white py-10 w-full">
        <div className="px-4 sm:px-6 lg:px-8">

          {/* Full-width grid layout */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
            <StepCard
              icon={<UserPlus className="h-6 w-6 text-black" />}
              title="Create an account"
              description="Sign up to get started"
            />
            <StepCard
              icon={<Car className="h-6 w-6 text-black" />}
              title="Find cars"
              description="Browse our extensive inventory"
            />
            <StepCard
              icon={<MessageSquare className="h-6 w-6 text-black" />}
              title="Negotiate"
              description="Get the best deal possible"
            />
            <StepCard
              icon={<CreditCard className="h-6 w-6 text-black" />}
              title="Pay"
              description="Secure and easy payment options"
            />
            <StepCard
              icon={<Truck className="h-6 w-6 text-black" />}
              title="Deliver"
              description="Get your car delivered to you"
              className="col-span-2 lg:col-span-1"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function StepCard({ icon, title, description, className = "" }) {
  return (
    <Card className={`bg-black text-white flex flex-col items-center p-4 w-full h-full border-white/10 ${className}`}>
      <CardHeader className="flex flex-col items-center text-center space-y-2 w-full">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-white/90">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

