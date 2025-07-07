"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { VirtualizedCombobox } from "@/app/components/VirtualizedCombobox";
import { getCities, submitJackallClient, submitUserData } from "@/app/actions/actions";
import SuccessAnimation from "./successAnimation";

export default function AccounCreationCSR({ countryList, accountData, oldId, currentUserId, serverTime, userEmail }) {
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const router = useRouter();

    const formRef = useRef(null);
    const [countryValue, setCountryValue] = useState("");
    const [cityValue, setCityValue] = useState("");
    const [cityList, setCityList] = useState([]);
    const dataRef = useRef({ country: null, city: "" });

    // user-facing labels
    const fieldLabels = {
        firstName: "First Name",
        lastName: "Last Name",
        phoneNumber: "Phone Number",
        country: "Country",
        city: "City",
        address: "Address",
        postalCode: "Postal Code",
    };

    // validation logic
    const validateFields = () => {
        const formData = new FormData(formRef.current);
        const payload = {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            phoneNumber: formData.get("phoneNumber"),
            country: dataRef.current.country?.name || "",
            city: dataRef.current.city,
            address: formData.get("address"),
            postalCode: formData.get("postalCode"),
        };
        const missing = [];
        for (const [key, value] of Object.entries(payload)) {
            if (!value || String(value).trim() === "") {
                missing.push(fieldLabels[key]);
            }
        }
        setErrors(missing);
        return missing.length === 0;
    };

    // initial validation on mount (and any time country/city change)
    useEffect(() => {
        validateFields();
    }, [countryValue, cityValue]);

    useEffect(() => {
        if (showSuccessScreen) {
            const redirectTimer = setTimeout(() => router.push("/"), 3000);
            return () => clearTimeout(redirectTimer);
        }
    }, [showSuccessScreen, router]);

    // Populate country/city if accountData exists
    useEffect(() => {
        if (!accountData?.country) return;
        const matched = countryList.find(
            (c) => c.name.toLowerCase() === accountData.country.toLowerCase()
        );
        if (!matched) return;
        setCountryValue(matched.isoCode);
        dataRef.current.country = matched;
        getCities(matched.isoCode)
            .then((cities) => {
                setCityList(cities);
                setCityValue(accountData.city || "");
                dataRef.current.city = accountData.city || "";
            })
            .catch((err) => {
                console.error("Error fetching cities:", err);
                setCityList([]);
            });
    }, [accountData, countryList]);

    const handleCountrySelect = (iso) => {
        setCountryValue(iso);
        const country = countryList.find((c) => c.isoCode === iso);
        if (!country) return;
        dataRef.current.country = country;
        getCities(iso)
            .then((cities) => {
                setCityList(cities);
                setCityValue("");
                dataRef.current.city = "";
            })
            .catch((err) => {
                console.error("Error fetching cities:", err);
                setCityList([]);
            });
    };

    const handleCitySelect = (city) => {
        setCityValue(city);
        dataRef.current.city = city;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // re-validate before submit
        if (!validateFields()) {
            setIsSubmitting(false);
            return;
        }

        console.log("Form submitted:", userEmail);
        const newId = currentUserId + 1;
        const generatedKeywords = generateKeywords([userEmail]);

        try {
            const formData = new FormData(formRef.current);
            const payload = {
                firstName: formData.get("firstName"),
                lastName: formData.get("lastName"),
                phoneNumber: formData.get("phoneNumber"),
                country: dataRef.current.country.name,
                city: dataRef.current.city,
                address: formData.get("address"),
                postalCode: formData.get("postalCode"),
            };
            await submitUserData({
                userEmail,
                city: payload.city,
                country: payload.country,
                textFirst: payload.firstName,
                textLast: payload.lastName,
                textPhoneNumber: payload.phoneNumber,
                textStreet: payload.address,
                textZip: payload.postalCode,
                accountCreated: serverTime,
                client_id: oldId || newId,
                currentId: currentUserId,
                keywords: generatedKeywords,
            });
            await submitJackallClient({
                userEmail,
                newClientId: newId,
                firstName: payload.firstName,
                lastName: payload.lastName,
                zip: payload.postalCode,
                street: payload.address,
                city: payload.city,
                phoneNumber: payload.phoneNumber,
                countryName: payload.country,
                note: "",
            });
            setShowSuccessScreen(true);
        } catch (error) {
            console.error("There is an error.", error);
            setIsSubmitting(false);
        }
    };

    if (showSuccessScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <div className="text-center">
                    <SuccessAnimation />
                    <h2 className="text-3xl font-bold text-green-600 mb-4">Success!</h2>
                    <p className="text-xl text-gray-700 mb-6">Your information has been successfully submitted.</p>
                    <p className="text-gray-500">Redirecting to home page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center z-10 p-1">
            <Card className="w-full max-w-[750px] shadow-lg bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-blue-800">
                        New User Log In
                    </CardTitle>
                    <CardDescription>
                        Kindly complete the form to gain full access to all features of the
                        website.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {errors.length > 0 && (
                        <div className="mb-4 text-red-600">
                            <p>Please fill in the following fields before proceeding:</p>
                            <ul className="list-disc list-inside">
                                {errors.map((label) => (
                                    <li key={label}>{label}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 max-[375px]:grid-cols-1">
                            <Input
                                name="firstName"
                                placeholder="First Name"
                                defaultValue={accountData?.textFirst || ""}
                                className={errors.includes(fieldLabels.firstName) ? 'border-red-500' : ''}
                            />
                            <Input
                                name="lastName"
                                placeholder="Last Name"
                                defaultValue={accountData?.textLast || ""}
                                className={errors.includes(fieldLabels.lastName) ? 'border-red-500' : ''}
                            />
                        </div>

                        <Input
                            name="phoneNumber"
                            placeholder="Phone Number"
                            defaultValue={accountData?.textPhoneNumber || ""}
                            className={errors.includes(fieldLabels.phoneNumber) ? 'border-red-500' : ''}
                        />

                        <div className="grid grid-cols-2 gap-4 max-[375px]:grid-cols-1">
                            <VirtualizedCombobox
                                items={countryList}
                                value={countryValue}
                                onSelect={handleCountrySelect}
                                placeholder="Select Country"
                                valueKey="isoCode"
                                labelKey="name"
                                className={errors.includes(fieldLabels.country) ? 'border-red-500' : ''}
                            />

                            <VirtualizedCombobox
                                items={cityList}
                                value={cityValue}
                                onSelect={handleCitySelect}
                                placeholder="Select City"
                                className={errors.includes(fieldLabels.city) ? 'border-red-500' : ''}
                            />
                        </div>

                        <Input
                            name="address"
                                placeholder="Address"
                                defaultValue={accountData?.textStreet || ""}
                                className={errors.includes(fieldLabels.address) ? 'border-red-500' : ''}
                        />

                        <Input
                            name="postalCode"
                            placeholder="Postal Code"
                            defaultValue={accountData?.textZip || ""}
                            className={errors.includes(fieldLabels.postalCode) ? 'border-red-500' : ''}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white h-10"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </form>
                </CardContent>

            </Card>
        </div>
    );
}

// keep generateKeywords defined below
const generateKeywords = (fields) => {
    const keywords = new Set();
    fields.forEach((field) => {
        const words = field.toLowerCase().split(" ");
        words.forEach((word) => {
            for (let i = 1; i <= word.length; i++) {
                keywords.add(word.substring(0, i));
            }
        });
        const maxSubstringLength = 50;
        for (let i = 0; i < field.length; i++) {
            for (let j = i + 1; j <= field.length && j - i <= maxSubstringLength; j++) {
                keywords.add(field.substring(i, j).toLowerCase());
            }
        }
    });
    return Array.from(keywords);
};
