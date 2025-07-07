"use client"

import * as React from "react"
import {
  UserPlus,
  Mail,
  LogIn,
  Car,
  Search,
  Calculator,
  MessageSquare,
  MapPin,
  PenBox,
  CheckSquare,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const steps = [
  {
    title: "Sign up",
    icon: <UserPlus className="h-6 w-6" />,
    content: "Create your account on our website to get started.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F1.webp?alt=media&token=bf1b1a82-e089-46b1-ba57-2c9150368784",
  },
  {
    title: "Get the email link",
    icon: <Mail className="h-6 w-6" />,
    content: "Check your email for a verification link and click it to confirm your account.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F2.webp?alt=media&token=ba2e7c76-e5c3-4804-92ff-db64f1c4d6c7",
  },
  {
    title: "Log in",
    icon: <LogIn className="h-6 w-6" />,
    content: "Return to the website and log in with your new account.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F3.webp?alt=media&token=71821b99-d6ab-43b0-9a5f-0bdddae0f294",
  },
  {
    title: "Go to Car Stock",
    icon: <Car className="h-6 w-6" />,
    content: "Navigate to the Car Stock section to browse available vehicles.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F4.webp?alt=media&token=243d6312-12da-4074-bb7c-12051a367bed",
  },
  {
    title: "Search a car",
    icon: <Search className="h-6 w-6" />,
    content:
      "Use the search filters to find cars that match your preferences. You can filter by: Makers, Models, Body type, Minimum and maximum mileage, Minimum and maximum year, and more.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F5.webp?alt=media&token=614e9c45-939e-4dd5-82fb-2dedbf1b73d2",
  },
  {
    title: "Use Price Calculator",
    icon: <Calculator className="h-6 w-6" />,
    content: "Utilize the TOTAL PRICE CALCULATOR to get a comprehensive cost estimate for your chosen vehicle.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F6.webp?alt=media&token=a764f52a-6de3-4fc0-8893-8f96574232d8",
  },
  {
    title: "Send Message",
    icon: <MessageSquare className="h-6 w-6" />,
    content: "Once you've found a car you're interested in, click the 'Send Message' button.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F7.webp?alt=media&token=128fb147-4f71-4ab1-92d0-b94501e9ed93",
  },
  {
    title: "Select Location",
    icon: <MapPin className="h-6 w-6" />,
    content: "In the product screen, select your country and preferred port.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F8.webp?alt=media&token=60b927ca-7de9-4093-9224-37416663cfbd",
  },
  {
    title: "Write Message",
    icon: <PenBox className="h-6 w-6" />,
    content: "Compose your inquiry message in the provided text area.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F9.webp?alt=media&token=a87432c0-d247-476a-9462-8c9d03bbf86a",
  },
  {
    title: "Agree and Send",
    icon: <CheckSquare className="h-6 w-6" />,
    content: "Check the 'I agree' box and click 'Send Inquiry' to submit your request.",
    link: "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Fhowtobuy%2F10.webp?alt=media&token=40c10228-d8cf-461a-9380-4694abe0e967",
  },
]

export default function HowToBuyCom() {
  const [activeStep, setActiveStep] = React.useState(0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold">How to Buy</h1>
        <p className="mt-4 text-lg text-gray-600">Follow these simple steps to purchase your dream car</p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeStep === index ? "border-primary ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => setActiveStep(index)}
            >
              <CardContent className="flex items-start gap-4 p-6">
                <div
                  className={`rounded-full bg-primary p-3 text-white ${
                    activeStep === index ? "bg-primary" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{step.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Area */}
        <div className="lg:sticky lg:top-8">
          <Card className="overflow-hidden">
            <div className="aspect-video w-full">
              <img
                src={steps[activeStep].link || "/placeholder.svg"}
                alt={steps[activeStep].title}
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold">
                Step {activeStep + 1}: {steps[activeStep].title}
              </h3>
              <p className="mt-2 text-gray-600">{steps[activeStep].content}</p>
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  disabled={activeStep === 0}
                >
                  Previous Step
                </Button>
                <Button
                  onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  disabled={activeStep === steps.length - 1}
                >
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

