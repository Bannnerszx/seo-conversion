"use client";
import { getCities } from "@/app/actions/actions";
import { VirtualizedCombobox } from "@/app/components/VirtualizedCombobox";
import { useState, useEffect, use } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { editUserData } from "@/app/actions/actions";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SideMenu } from "@/app/orders/orderComponents/sideMenu";
import Sidebar from "@/app/orders/orderComponents/sidebar";
const formSchema = z.object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phoneNumber: z.string().min(5, { message: "Please enter a valid phone number." }),
    country: z.string().min(1, { message: "Please select a country." }),
    city: z.string().min(1, { message: "Please enter a city." }),
    address: z.string().min(5, { message: "Address must be at least 5 characters." }),
    postalCode: z.string().optional(),
});

export default function ProfilePage({ count, userEmail, accountData, countryList }) {
    const countryObj = countryList.find(c => c.name === accountData.country);
    const [selectedCountry, setSelectedCountry] = useState(countryObj || {});
    const defaultValues = {
        firstName: accountData.textFirst,
        lastName: accountData.textLast,
        email: accountData.textEmail,
        phoneNumber: accountData.textPhoneNumber,
        country: countryObj?.name || "",
        city: accountData.city,
        address: accountData.textStreet,
        postalCode: accountData.textZip,
    };
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    });
    console.log(form.getValues());
    const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cityList, setCityList] = useState([]);

    const handleCountrySelect = (isoCode) => {
        const country = countryList.find(c => c.isoCode === isoCode)
        setSelectedCountry(country)
        // Store full country object in form1 ref
    };

    useEffect(() => {
        if (!selectedCountry.isoCode) return;

        getCities(selectedCountry.isoCode)
            .then((cities) => {
                setCityList(cities);

                // clear the city field if it no longer applies
                if (!cities.includes(form.getValues("city"))) {
                    form.setValue("city", "");
                }
            })
            .catch((err) => {
                console.error("Error fetching cities:", err);
                setCityList([]);
            });
    }, [selectedCountry.isoCode]);


    const onSubmit = async (data) => {
        setIsSubmitting(true);

        try {
            // build a single payload object
            const payload = {
                userEmail,                            // from your props
                city: data.city,            // from RHF
                country: selectedCountry.name, // from your country state
                textFirst: data.firstName,       // map your form names → Firestore field names
                textLast: data.lastName,
                textPhoneNumber: data.phoneNumber,
                textStreet: data.address,
                textZip: data.postalCode,

            };

            // call your action with that payload
            await editUserData(payload);

            toast("Profile updated", {
                description: <span style={{ color: "gray" }}>Your profile was saved.</span>,
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            <Sidebar count={count} activePage="profile" accountData={accountData} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-[#0000ff] text-white p-4 hidden md:flex md:justify-between md:items-center">
                    <h1 className="text-2xl font-bold text-white">Profile</h1>
                </header>

                <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
                    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                <User className="h-8 w-8 text-blue-700" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Edit Profile Details</h2>
                                <p className="text-gray-500">Update your personal information</p>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your first name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your last name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        disabled={true}
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your phone number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <VirtualizedCombobox
                                                    items={countryList}
                                                    value={selectedCountry.isoCode} // this is the country **name**
                                                    onSelect={(isoCode) => {
                                                        const selected = countryList.find(c => c.isoCode === isoCode);
                                                        console.log(field)
                                                        field.onChange(selected.name);

                                                        setSelectedCountry(selected);
                                                    }}

                                                    placeholder="Select Country"
                                                    valueKey="isoCode"
                                                    labelKey="name"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <VirtualizedCombobox
                                                    items={cityList}
                                                    value={field.value} // controlled by RHF
                                                    onSelect={(city) => field.onChange(city)} // update form state
                                                    placeholder="Select City"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Enter your address" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your postal code" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full md:w-auto bg-blue-700" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>

            <SideMenu isOpen={isRightMenuOpen} setIsOpen={setIsRightMenuOpen} />
        </div>
    );
}
