"use client"

import { Button } from "@/components/ui/button"
import { FileText, Image, FileArchive, LinkIcon, Calendar, MapPin, CreditCard } from "lucide-react"

export function MessageButtons({ messageType, onButtonClick }) {
  // Define button configurations based on message types
  const getButtonConfig = () => {
    switch (messageType) {
      case "document":
        return {
          icon: <FileText className="h-4 w-4 mr-1" />,
          text: "View Document",
          variant: "outline",
          className: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
        }
      case "image":
        return {
          icon: <Image className="h-4 w-4 mr-1" />,
          text: "View Image",
          variant: "outline",
          className: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200",
        }
      case "file":
        return {
          icon: <FileArchive className="h-4 w-4 mr-1" />,
          text: "Download File",
          variant: "outline",
          className: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
        }
      case "link":
        return {
          icon: <LinkIcon className="h-4 w-4 mr-1" />,
          text: "Open Link",
          variant: "outline",
          className: "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200",
        }
      case "event":
        return {
          icon: <Calendar className="h-4 w-4 mr-1" />,
          text: "View Event",
          variant: "outline",
          className: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200",
        }
      case "location":
        return {
          icon: <MapPin className="h-4 w-4 mr-1" />,
          text: "View Location",
          variant: "outline",
          className: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200",
        }
      case "payment":
        return {
          icon: <CreditCard className="h-4 w-4 mr-1" />,
          text: "View Payment",
          variant: "outline",
          className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200",
        }
      default:
        return null
    }
  }

  const buttonConfig = getButtonConfig()

  if (!buttonConfig) return null

  return (
    <Button
      variant={buttonConfig.variant}
      size="sm"
      className={`mt-2 text-xs font-medium ${buttonConfig.className}`}
      onClick={() => onButtonClick(messageType)}
    >
      {buttonConfig.icon}
      {buttonConfig.text}
    </Button>
  )
}
