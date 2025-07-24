import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TransactionCSRLoader() {
    return (
        <div className="flex flex-col h-full">
            {/* Car Details Section Skeleton */}
            <div className="relative w-full">
                <div className="relative z-[5]">
                    {/* Car Details Skeleton */}
                    <div className="bg-white p-6 border-b w-full overflow-x-auto">
                        <div className="flex flex-nowrap gap-6 w-max">
                            {/* Left side – Car image and details */}
                            <div className="flex-1 min-w-[250px]">
                                <div className="flex items-start gap-4 mb-4">
                                    <Skeleton className="w-14 h-14 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32 mb-3" />
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-400" />
                                            <Skeleton className="w-3 h-3 rounded-full" />
                                            <Skeleton className="w-3 h-3 rounded-full" />
                                            <Skeleton className="w-3 h-3 rounded-full" />
                                            <Skeleton className="w-3 h-3 rounded-full" />
                                            <Skeleton className="w-3 h-3 rounded-full" />
                                            <Skeleton className="w-3 h-3 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right side – Price and details */}
                            <div className="flex-1 min-w-[250px]">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <Skeleton className="h-4 w-20" />
                                        <div className="text-right">
                                            <Skeleton className="h-4 w-16 mb-1" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-4 w-22" />
                                        <Skeleton className="h-4 w-22" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Skeleton */}

                    <div className="bg-white p-4 border-b overflow-x-auto">
                        <div className="flex flex-nowrap gap-3 min-w-max">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-8 w-28" />
                            <Skeleton className="h-8 w-36" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </div>



                </div>
            </div>

            {/* Chat Messages Area */}
            <ScrollArea className="h-full p-4 custom-scroll bg-[#E5EBFE]">
                <div className="space-y-4 mt-8">
                    {/* Received Message Skeleton */}
                    <div className="w-full">
                        <div className="flex w-full justify-start">
                            <div className="max-w-[75%] p-3 rounded-lg bg-white text-gray-800 rounded-bl-none">
                                <Skeleton className="h-4 w-48 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <div className="w-full flex justify-start">
                            <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                    </div>

                    {/* Sent Message Skeleton */}
                    <div className="w-full">
                        <div className="flex w-full justify-end">
                            <div className="max-w-[75%] p-3 rounded-lg bg-blue-500 text-white rounded-br-none">
                                <Skeleton className="h-4 w-40 mb-2 bg-blue-400" />
                                <Skeleton className="h-4 w-24 bg-blue-400" />
                            </div>
                        </div>
                        <div className="w-full flex justify-end">
                            <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                    </div>

                    {/* Received Message with Button Skeleton */}
                    <div className="w-full">
                        <div className="flex w-full justify-start">
                            <div className="max-w-[75%] p-3 rounded-lg bg-white text-gray-800 rounded-bl-none">
                                <Skeleton className="h-4 w-56 mb-2" />
                                <Skeleton className="h-4 w-40 mb-3" />

                            </div>
                        </div>
                        <div className="w-full flex justify-start">
                            <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                    </div>

                    {/* Long Received Message Skeleton */}

                    {/* Sent Message Skeleton */}
                    <div className="w-full">
                        <div className="flex w-full justify-end">
                            <div className="max-w-[75%] p-3 rounded-lg bg-blue-500 text-white rounded-br-none">
                                <Skeleton className="h-4 w-36 bg-blue-400" />
                            </div>
                        </div>
                        <div className="w-full flex justify-end">
                            <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="flex w-full justify-start">
                            <div className="max-w-[75%]  p-3 rounded-lg bg-white text-gray-800 rounded-bl-none">
                                <Skeleton className="h-4 flex w-56 mb-2" />
                            </div>

                        </div>
                        <div className="w-full flex justify-start">
                            <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                    </div>
                    {/* Important Message with Downloads Skeleton */}


                    <div className="w-full">
                        <div className="flex w-full justify-end">
                            <div className="max-w-[75%] p-3 rounded-lg bg-blue-500 text-white rounded-br-none">
                                <Skeleton className="h-4 w-36 bg-blue-400" />
                            </div>
                        </div>
                        <div className="w-full flex justify-end">
                            <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Chat Input Skeleton */}
            <div className="bg-white border-t p-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
            </div>
        </div>
    )
}
