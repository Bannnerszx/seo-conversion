import { cn } from "@/lib/utils"


export function TransactionSkeleton({ count = 8, className }) {
    return (
        <div className={cn("space-y-4", className)}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-3">
                    {/* Car image skeleton */}
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse flex-shrink-0" />

                    {/* Content skeleton */}
                    <div className="flex-1 space-y-2">
                        {/* Vehicle title skeleton */}
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />

                        {/* Price/description skeleton */}
                        <div className="flex items-center gap-2">
                            <div className="h-3 bg-muted rounded animate-pulse w-16" />
                            <div className="h-3 bg-muted rounded animate-pulse w-24" />
                        </div>
                    </div>

                    {/* Date skeleton */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="h-3 bg-muted rounded animate-pulse w-12" />
                        <div className="h-3 bg-muted rounded animate-pulse w-10" />
                    </div>
                </div>
            ))}
        </div>
    )
}


