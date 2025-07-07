"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown, Home } from "lucide-react"
import { usePathname } from "next/navigation"

import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMobile } from "./use-mobile"
export function Breadcrumbs({ items, maxItems = 5 }) {
    const [open, setOpen] = useState(false)
    const isMobile = useMobile()

    // on mobile, collapse after 3; otherwise use the passed-in maxItems
    const effectiveMaxItems = isMobile ? 3 : maxItems


    if (items.length <= effectiveMaxItems) {
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            <BreadcrumbItem>
                                {index === items.length - 1 ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {index < items.length - 1 && <BreadcrumbSeparator />}
                        </React.Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        )
    }

    const firstItem = items[0]
    const lastItem = items[items.length - 1]
    const collapsedItems = items.slice(1, -1)

    if (isMobile) {
        // mobile collapse UI (drawer)
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href={firstItem.href}>
                            {firstItem.label}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <Drawer open={open} onOpenChange={setOpen}>
                            <DrawerTrigger asChild>
                                <BreadcrumbEllipsis className="h-4 w-4" />
                            </DrawerTrigger>
                            <DrawerContent className="z-[9998]">
                                <DrawerHeader className="text-left">
                                    <DrawerTitle>Navigate to</DrawerTitle>
                                    <DrawerDescription>
                                        Select a page to navigate to.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <div className="grid gap-1 px-4">
                                    {collapsedItems.map((item, idx) => (
                                        <a
                                            key={idx}
                                            href={item.href}
                                            className="py-1 text-sm"
                                            onClick={() => setOpen(false)}
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                                <DrawerFooter className="pt-4">
                                    <DrawerClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{lastItem.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        )
    }

    // desktop collapse UI (ellipsis + dropdown)
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href={firstItem.href}>
                        {firstItem.label}
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger
                            className="flex items-center gap-1"
                            aria-label="Toggle menu"
                        >
                            <BreadcrumbEllipsis className="h-4 w-4" />
                            <ChevronDown className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {collapsedItems.map((item, idx) => (
                                <DropdownMenuItem key={idx} asChild>
                                    <a href={item.href}>{item.label}</a>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{lastItem.label}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export function DynamicBreadcrumbs({ maxItems = 5 }) {
    const pathname = usePathname()
    const segments = pathname.split("/").filter(Boolean)

    // state for our fetched vehicle data
    const [vehicle, setVehicle] = useState(null)
    console.log('vehilce', vehicle)
    // whenever the path changes, if we're on /product/[id], fetch its data
    useEffect(() => {
        if (segments[0] === "product" && segments[1]) {
            fetch(`/api/fetch-breadcrumb?stockId=${encodeURIComponent(segments[1])}`)
                .then((res) => res.json())
                .then((data) => {
                    // expect { maker, model, carName }
                    setVehicle(data)
                })
                .catch((err) => {
                    console.error("Failed to load vehicle for breadcrumbs", err)
                    setVehicle(null)
                })
        } else {
            // clear out when navigating away
            setVehicle(null)
        }
    }, [pathname])

    // if on /product/[id], and we've fetched the vehicle, render a fixed trail
    if (segments[0] === "product") {
        // still loading?
        if (!vehicle) {
            return null
        }

        const { make, model, carName } = vehicle

        const items = [
            { href: "/", label: <Home className="h-5 w-5" /> },

            { href: "/stock", label: "Stock" },

            {
                href: `/stock/${encodeURIComponent(make)}`,
                label: make,
            },
            {
                href: `/stock/${encodeURIComponent(make)}/${encodeURIComponent(model)}`,
                label: model,
            },
            {
                label: carName,
            },
        ]

        return <Breadcrumbs items={items} maxItems={maxItems} />
    }

    // otherwise, generic decode + title-case crumbs
    const generateBreadcrumbs = (path) => {
        const segs = path.split("/").filter(Boolean)
        const crumbs = [
            {
                href: "/",
                label: <Home className="h-5 w-5" />,
            },
        ]
        let current = ""

        segs.forEach((segment, idx) => {
            current += `/${segment}`
            const decoded = decodeURIComponent(segment).replace(/-/g, " ")
            const label = decoded
                .split(" ")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ")

            if (idx === segs.length - 1) {
                crumbs.push({ label })
            } else {
                crumbs.push({ href: current, label })
            }
        })

        return crumbs
    }

    const items = generateBreadcrumbs(pathname)
    return <Breadcrumbs items={items} maxItems={maxItems} />
}