import React from "react"
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Users,
    Building,
    Car,
    Shield,
    Wrench,
    Contact,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ZambiaBranchSection() {
    return (
        <div className="space-y-4 mx-auto w-full max-w-7xl mb-4 px-4">
            {/* Local Branch in Zambia Section */}
            <div className="rounded-lg p-6">
                <div className="text-center mb-8">
                    <h3 className="text-5xl font-bold mb-2">Local Branch in Zambia</h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Your trusted partner for Japanese car imports in Zambia. We provide
                        local support, inspection services, and seamless delivery right to
                        your doorstep.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Lusaka Branch */}
                    <Card className="bg-white/80 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building className="h-5 w-5 text-blue-600" />
                                Lusaka Office
                            </CardTitle>
                            <CardDescription>
                                Your local Japanese car import specialists
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                                <div className="text-sm">
                                    <p className="font-medium">Plot # 13, House # 5017, Near Qurrat Academy, Saise Road, Rhodes Park</p>
                                    <p className="text-muted-foreground">
                                        Lusaka, Zambia
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium">+260 772 114 575</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Contact className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium">Mr. Mwale</p>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium">+260 772 114 476</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Contact className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium">Mr. Sikapizye</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <div className="text-sm">
                                    <p className="font-medium">mcenterprises02@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-blue-600 mt-1" />
                                <div className="text-sm">
                                    <p className="font-medium">Mon–Sun: 8 AM–5 PM</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chipata Branch */}
                    <Card className="bg-white/80 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building className="h-5 w-5 text-blue-600" />
                                Chipata Office
                            </CardTitle>
                            <CardDescription>
                                Your local Japanese car import specialists
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                                <div className="text-sm">
                                    <p className="font-medium">Plot 674, Off Umodzi Highway</p>
                                    <p className="text-muted-foreground">
                                        Chipata, Eastern Province, Zambia
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-600" />
                                <div className="text-sm">
                                    <p className="font-medium">+260 772 114 575</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Contact className="h-4 w-4 text-blue-600" />
                                <p className="text-sm font-medium">Mr. Mwale</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <div className="text-sm">
                                    <p className="font-medium">mwasikapi@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-blue-600 mt-1" />
                                <div className="text-sm">
                                    <p className="font-medium">Mon–Sun: 8 AM–5 PM</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact & Action */}
                    <Card className="bg-white/80 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                                Get Local Support
                            </CardTitle>
                            <CardDescription>Connect with our Zambia team today</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Our experienced local team speaks English, Bemba, and Nyanja. We
                                understand the Zambian market and regulations.
                            </p>
                            <div className="space-y-2">
                                {/* WhatsApp link to +81 90 3906 5223 */}
                                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                                    <a
                                        href="https://wa.me/819039065223"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Contact Zambia Office
                                    </a>
                                </Button>
                                <Button asChild variant="outline" className="w-full bg-transparent">
                                    <a
                                        href="https://wa.me/819039065223"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Schedule Visit
                                    </a>
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                                <p>Serving customers across Zambia</p>
                                <p className="font-medium">Lusaka • Kitwe • Ndola • Livingstone</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
