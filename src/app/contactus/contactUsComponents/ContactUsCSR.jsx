"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AtSign, MapPin, Phone, Send, Facebook, Instagram } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    subject: z.string().min(5, {
        message: "Subject must be at least 5 characters.",
    }),
    message: z.string().min(10, {
        message: "Message must be at least 10 characters.",
    }),
})

export default function ContactUs() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    })

    const onSubmit = (values) => {
        setIsSubmitting(true)
        setTimeout(() => {
            toast("Message sent!", {
                description: <span style={{ color: "gray" }}>We'll get back to you as soon as possible.</span>,
            });
            setIsSubmitting(false);
        }, 1500);

    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 mt-5">
            <div className="flex flex-col items-center text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-blue-700 md:text-4xl">Contact Us</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                    Have questions or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
                </p>
            </div>

            <div className="max-w-[500px] w-full mx-auto">
                {/* <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <CardTitle className="text-blue-700">Send us a message</CardTitle>
                        <CardDescription>Fill out the form below to get in touch with our team.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="your.email@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Input placeholder="What is this regarding?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Please provide details about your inquiry..."
                                                    className="min-h-32"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Sending...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Send className="h-4 w-4" />
                                            Send Message
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card> */}

                <div className="flex flex-col gap-8">
                    <Card className="border-blue-200">
                        <CardHeader className="bg-blue-50 border-b border-blue-100">
                            <CardTitle className="text-blue-700">Contact Information</CardTitle>
                            <CardDescription>Other ways to reach our team.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <MapPin className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Our Address</h3>
                                        <p className="text-muted-foreground">
                                            5-2 Nishihaiagari, Kamigaoka-cho
                                            <br />
                                            Toyota city, Aichi Prefecture
                                            <br />
                                            Japan 473-0931
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <Phone className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Phone</h3>
                                        <p className="text-muted-foreground">
                                            +81-565-85-0602
                                            <br />
                                            Monday - Friday, 9am - 6pm JST
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <AtSign className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Email</h3>
                                        <p className="text-muted-foreground">
                                            info@realmotor.jp
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <Facebook className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Facebook</h3>
                                        <p className="text-muted-foreground">
                                            <a
                                                href="https://www.facebook.com/RealMotorJP"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-blue-800"
                                            >
                                                facebook.com/RealMotorJP
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <Instagram className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Instagram</h3>
                                        <p className="text-muted-foreground">
                                            <a
                                                href="https://www.instagram.com/realmotorjp/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-blue-800"
                                            >
                                                instagram.com/realmotorjp
                                            </a>
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200">
                        <CardHeader className="bg-blue-50 border-b border-blue-100">
                            <CardTitle className="text-blue-700">Business Hours</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Monday - Friday</span>
                                    <span>9:00 AM - 6:00 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saturday</span>
                                    <span>9:00 AM - 6:00 PM</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
