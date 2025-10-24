'use client'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Info } from "lucide-react"

export function VehicleRequestSection() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                size="lg"
                className="bg-[#0000ff] hover:bg-blue-700 text-white px-10 py-6 rounded-md w-full max-w-[250px]"
            >
            
                <span className="text-lg font-semibold text-white">Request a Vehicle</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Request a Vehicle
                        </DialogTitle>

                        {/* Render as div to avoid <p> inside <p> */}
                        <DialogDescription asChild>
                            <div className="text-left pt-4 space-y-3">
                                <p className="text-foreground font-medium">
                                    {"Can't find the vehicle you're looking for?"}
                                </p>

                                <p className="text-muted-foreground">
                                    If your desired vehicle is not currently available in our inventory, you can submit a request. Our team will
                                    search for your specific vehicle and notify you when it becomes available.
                                </p>

                                <div className="bg-muted/50 p-3 rounded-md">
                                    <p className="text-sm text-muted-foreground">
                                        <strong className="text-foreground">What happens next:</strong>
                                    </p>
                                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                        <li>Fill out the request form</li>
                                        <li>We'll search our network for your vehicle</li>
                                        <li>Get notified when we find a match</li>
                                    </ul>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                            <a href="/request-form" target="_blank" rel="noopener noreferrer">
                                Go to Request Form
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
