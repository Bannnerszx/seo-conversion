"use client"
import { Search } from "lucide-react"
import Link from "next/link"

export default function RequestCarBanner() {
    return (
        <div className="rounded-xl border-2 border-[#0000ff] p-4 sm:p-6 m-4">
            <div className="flex flex-col items-start gap-3 sm:items-center md:flex-row md:justify-between md:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#0000ff] sm:h-12 sm:w-12">
                        <Search className="h-5 w-5 sm:h-6 sm:w-6 text-[#0000ff]" />
                    </div>
                    <div>
                        <h3 className="text-md font-semibold text-card-foreground">
                            Can&apos;t find your dream car?
                        </h3>
                        <p className="text-pretty text-sm text-muted-foreground sm:text-sm">
                            Let us know what you&apos;re looking for and we&apos;ll find it for you
                        </p>
                    </div>
                </div>

                <Link
                    href="/request-form"
                    className="inline-flex h-12 w-full md:w-auto items-center justify-center rounded-md shadow-lg bg-[#0000ff] hover:scale-105 px-4 text-md font-semibold text-white hover:opacity-90 text-center"
                >
                    Request Specific Car
                </Link>

            </div>
        </div>
    )
}
