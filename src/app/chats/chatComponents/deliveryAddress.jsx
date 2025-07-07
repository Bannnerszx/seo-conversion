"use client"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import moment from "moment"
import { useState, useRef } from "react"
import { X, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Modal from "@/app/components/Modal"
import { docDelivery, getCities } from "@/app/actions/actions"
import { VirtualizedCombobox } from "@/app/components/VirtualizedCombobox"
import { cn } from "@/lib/utils"
// Sample customer data for demonstration


export default function DeliveryAddress({ accountData, countryList, setOrderModal, chatId, userEmail }) {

    // Initialize refs for form data
    const [useCustomerInfo, setUseCustomerInfo] = useState(false)
    const [showAdditionalPhone, setShowAdditionalPhone] = useState(false)
    const [showAdditionalPhone2, setShowAdditionalPhone2] = useState(false)
    const [agreeToTerms, setAgreeToTerms] = useState(false)
    const [amendVisible, setAmendVisible] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState(null)
    const [selectedCity, setSelectedCity] = useState("")

    // Form refs (for uncontrolled components)
    const form1Ref = useRef({})
    const form2Ref = useRef({})

    // Countries state (for dropdown options)
    const [countries] = useState(countryList)

    // City list for customer form
    const [cityList, setCityList] = useState([])

    // Billing city list for form2

    // Handle customer information autofill using sample data
    const handleUseCustomerInfo = (checked) => {
        setUseCustomerInfo(checked);

        if (checked) {
            const countryObj = countryList.find((c) => c.name === accountData?.country);
            const sampleCustomerData = {
                fullName: `${accountData?.textFirst || ''} ${accountData?.textLast || ''}`.trim(),
                country: countryObj || null, // Store full country object
                city: accountData?.city || "Tokyo",
                address: accountData?.textStreet || "123 Broadway St, Apt 4B",
                telephoneNumber: accountData?.textPhoneNumber || "555-123-4567",
                faxNumber: accountData?.faxNumber || "",
                email: accountData?.textEmail || "john.doe@example.com",
            };
            // Update any uncontrolled fields using refs (skip country and city)
            Object.keys(sampleCustomerData).forEach(key => {
                if (key === "country" || key === "city") return;
                if (form1Ref.current[key] && typeof form1Ref.current[key] === 'object') {
                    form1Ref.current[key].value = sampleCustomerData[key] || '';
                }
            });

            // Set the country immediately (update state and ref)
            const country = sampleCustomerData.country || null;
            setSelectedCountry(country);
            form1Ref.current.country = country;

            // Fetch cities and update city after a delay
            getCities(country.isoCode)
                .then(cities => {
                    setCityList(cities);
                    setTimeout(() => {
                        const foundCity = cities.find(city => city.name === sampleCustomerData.city);
                        if (foundCity) {
                            setSelectedCity(foundCity);
                            form1Ref.current.city = foundCity;
                        } else {
                            setSelectedCity(sampleCustomerData.city || '');
                            form1Ref.current.city = sampleCustomerData.city || '';
                        }
                    }, 10);
                })
                .catch(err => {
                    console.error("Error fetching cities:", err);
                    setCityList([]);
                    setTimeout(() => {
                        setSelectedCity(sampleCustomerData.city || '');
                        form1Ref.current.city = sampleCustomerData.city || '';
                    }, 10);
                });
        } else {
            // When unchecked, clear only the fields that are actual DOM element references.
            Object.keys(form1Ref.current).forEach(key => {
                if (form1Ref.current[key] && typeof form1Ref.current[key] === 'object') {
                    form1Ref.current[key].value = '';
                }
            });

            // Clear controlled fields
            setSelectedCity('');
            setSelectedCountry(null);
        }
    };

    // --- Form 1 (Customer Information) State ---

    // Selected country and city for customer form

    // When a country is selected in Form 1
    const handleCountrySelect = (isoCode) => {
        const country = countries.find(c => c.isoCode === isoCode)
        setSelectedCountry(country)
        // Store full country object in form1 ref
        form1Ref.current.country = country

        // Immediately fetch cities for the selected country
        getCities(country.isoCode)
            .then(cities => {
                setCityList(cities)
                setSelectedCity("")
                form1Ref.current.city = ""
            })
            .catch(err => {
                console.error("Error fetching cities:", err)
                setCityList([])
            })
    }

    const handleCitySelect = (cityValue) => {
        setSelectedCity(cityValue)
        form1Ref.current.city = cityValue
    }

    // --- Form 2 (Billing Information) State ---

    // Selected country and city for billing form
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle form submission
    const docDeliveryFunction = httpsCallable(functions, 'docDelivery')
    // Add state for tracking field errors (add this to your component state)
    const [fieldErrors, setFieldErrors] = useState({});

    // Email validation function
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Form validation function
    const validateForm = () => {
        const errors = [];
        const newFieldErrors = {};

        // Check required fields
        if (!form1Ref.current.fullName?.value.trim()) {
            errors.push("Full Name is required");
            newFieldErrors.fullName = "Full Name is required";
        }

        if (!selectedCountry) {
            errors.push("Country is required");
            newFieldErrors.country = "Country is required";
        }

        if (!selectedCity) {
            errors.push("City is required");
            newFieldErrors.city = "City is required";
        }

        if (!form1Ref.current.address?.value.trim()) {
            errors.push("Address is required");
            newFieldErrors.address = "Address is required";
        }

        // Check at least one telephone number
        const phone1 = form1Ref.current.telephoneNumber?.value.trim();
        const phone2 = form1Ref.current.telephoneNumber2?.value.trim();
        if (!phone1 && !phone2) {
            errors.push("At least one telephone number is required");
            newFieldErrors.telephoneNumber = "At least one telephone number is required";
        }

        // Email validation (required and must be valid format)
        const email = form1Ref.current.email?.value.trim();
        if (!email) {
            errors.push("Email is required");
            newFieldErrors.email = "Email is required";
        } else if (!isValidEmail(email)) {
            errors.push("Please enter a valid email address");
            newFieldErrors.email = "Please enter a valid email address";
        }

        // Update field errors state for visual feedback
        setFieldErrors(newFieldErrors);

        return errors;
    };
    const clearFieldError = (fieldName) => {
        if (fieldErrors[fieldName]) {
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        if (isSubmitting) return; // NO DOUBLE DIPS

        // Validate form before proceeding
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            // Scroll to first error field for better UX
            const firstErrorField = Object.keys(fieldErrors)[0];
            if (firstErrorField && form1Ref.current[firstErrorField]) {
                form1Ref.current[firstErrorField].scrollIntoView({ behavior: 'smooth', block: 'center' });
                form1Ref.current[firstErrorField].focus();
            }
            return;
        }

        setIsSubmitting(true);
        const [ipResp, timeResp] = await Promise.all([
            fetch(
                "https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo"
            ),
            fetch(
                "https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time"
            ),
        ]);
        const [ipInfo, tokyoTime] = await Promise.all([
            ipResp.json(),
            timeResp.json(),
        ]);

        // Build telephone numbers array for Form 1 (customer information)
        const telephoneNumbersForm1 = [];
        if (form1Ref.current.telephoneNumber && form1Ref.current.telephoneNumber.value.trim() !== "") {
            telephoneNumbersForm1.push(form1Ref.current.telephoneNumber.value.trim());
        }
        if (form1Ref.current.telephoneNumber2 && form1Ref.current.telephoneNumber2.value.trim() !== "") {
            telephoneNumbersForm1.push(form1Ref.current.telephoneNumber2.value.trim());
        }

        // Build telephone numbers array for Form 2 (billing information)
        const telephoneNumbersForm2 = [];
        if (form2Ref.current.telephoneNumber && form2Ref.current.telephoneNumber.value.trim() !== "") {
            telephoneNumbersForm2.push(form2Ref.current.telephoneNumber.value.trim());
        }
        if (form2Ref.current.telephoneNumber2 && form2Ref.current.telephoneNumber2.value.trim() !== "") {
            telephoneNumbersForm2.push(form2Ref.current.telephoneNumber2.value.trim());
        }

        // Collect data for Form 1 (Customer Information)
        const form1Data = {
            fullName: form1Ref.current.fullName?.value,
            country: selectedCountry ? selectedCountry.name : "",
            city: selectedCity,
            address: form1Ref.current.address?.value,
            telephoneNumber: telephoneNumbersForm1, // array output
            faxNumber: form1Ref.current.faxNumber?.value,
            email: form1Ref.current.email?.value
        };

        // Collect data for Form 2 (Billing Information)
        try {
            const { data } = await docDeliveryFunction({ form1Data, chatId, userEmail, ipInfo, tokyoTime });
            if (data.success) {
                console.log("✅ Delivered!");
                setIsSubmitting(false)
            } else {
                throw new Error("Function returned no success flag");
            }
        } catch (error) {
            console.error('Error calling server action:', error);
            setIsSubmitting(false);
        } finally {
            setAmendVisible(false);
            setIsSubmitting(false);
        }
        // Add your submission logic here.
    };
    // Optional: Real-time email validation for better UX
    const handleEmailChange = (e) => {
        const email = e.target.value;
        clearFieldError('email'); // Clear error when user starts typing

        if (email && !isValidEmail(email)) {
            setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
        }
    };

    // Handle input changes for other fields
    const handleInputChange = (fieldName) => (e) => {
        clearFieldError(fieldName);
    };

    // Handle country selection with error clearing
    const handleCountrySelectWithValidation = (country) => {
        handleCountrySelect(country);
        clearFieldError('country');
    };

    // Handle city selection with error clearing
    const handleCitySelectWithValidation = (city) => {
        handleCitySelect(city);
        clearFieldError('city');
    };

    return (
        <>
            <Button
                onClick={() => setAmendVisible(true)}
                variant="default"
                className="w-full h-10 gap-2 bg-[#ffc600] text-[#ba0c2f] border-[#ba0c2f] hover:bg-[#ffe04e] font-bold"
            >
                <span>Delivery Address</span>
            </Button>
            <Modal showModal={amendVisible} setShowModal={setAmendVisible}>
                <div className="max-h-[85vh] overflow-y-auto z-[9999]">
                    <div className="container mx-auto py-6 px-4 max-w-3xl">
                        {/* Customer Information Form (Form 1) */}
                        <Card className="mb-6">
                            <CardHeader className="border-b pb-3 sticky top-0 bg-white z-10">
                                <CardTitle className="text-center text-blue-600">
                                    Document Delivery Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <h2 className="text-lg font-semibold mb-2">Customer Information</h2>

                                <div className="flex items-center mb-4">
                                    <Checkbox
                                        id="useCustomerInfo"
                                        checked={useCustomerInfo}
                                        onCheckedChange={handleUseCustomerInfo}
                                    />
                                    <Label htmlFor="useCustomerInfo" className="ml-2">
                                        Set as customer&apos;s information <span className="text-red-500">*</span>
                                    </Label>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="fullName" className={fieldErrors.fullName ? "text-red-600" : ""}>
                                            Full Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="fullName"
                                            placeholder="Enter full name"
                                            ref={(el) => {
                                                if (el) form1Ref.current.fullName = el
                                            }}
                                            defaultValue=""
                                            onChange={handleInputChange('fullName')}
                                            className={fieldErrors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                                            required
                                        />
                                        {fieldErrors.fullName && (
                                            <p className="text-red-600 text-sm mt-1 flex items-center">
                                                <span className="mr-1">⚠</span> {fieldErrors.fullName}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="country" className={fieldErrors.country ? "text-red-600" : ""}>
                                                Country <span className="text-red-500">*</span>
                                            </Label>
                                            <VirtualizedCombobox
                                                items={countryList}
                                                value={selectedCountry ? selectedCountry.isoCode : ""}
                                                onSelect={handleCountrySelectWithValidation}
                                                placeholder="Select Country"
                                                valueKey="isoCode"
                                                labelKey="name"
                                                className={fieldErrors.country ? "border-red-500" : ""}
                                                required
                                            />
                                            {fieldErrors.country && (
                                                <p className="text-red-600 text-sm mt-1 flex items-center">
                                                    <span className="mr-1">⚠</span> {fieldErrors.country}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="city" className={fieldErrors.city ? "text-red-600" : ""}>
                                                City <span className="text-red-500">*</span>
                                            </Label>
                                            <VirtualizedCombobox
                                                items={cityList}
                                                value={selectedCity}
                                                onSelect={handleCitySelectWithValidation}
                                                placeholder="Select City"
                                                className={fieldErrors.city ? "border-red-500" : ""}
                                                required
                                            />
                                            {fieldErrors.city && (
                                                <p className="text-red-600 text-sm mt-1 flex items-center">
                                                    <span className="mr-1">⚠</span> {fieldErrors.city}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="address" className={fieldErrors.address ? "text-red-600" : ""}>
                                            Address <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="address"
                                            placeholder="Enter full address"
                                            ref={(el) => (form1Ref.current.address = el)}
                                            defaultValue=""
                                            onChange={handleInputChange('address')}
                                            className={fieldErrors.address ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                                            required
                                        />
                                        {fieldErrors.address && (
                                            <p className="text-red-600 text-sm mt-1 flex items-center">
                                                <span className="mr-1">⚠</span> {fieldErrors.address}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <Label htmlFor="telephoneNumber" className={fieldErrors.telephoneNumber ? "text-red-600" : ""}>
                                                Telephone Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-blue-600 border-blue-600"
                                                onClick={() => setShowAdditionalPhone(true)}
                                            >
                                                + Add Telephone
                                            </Button>
                                        </div>
                                        <Input
                                            id="telephoneNumber"
                                            placeholder="Telephone Number 1"
                                            ref={(el) => (form1Ref.current.telephoneNumber = el)}
                                            defaultValue=""
                                            onChange={handleInputChange('telephoneNumber')}
                                            className={fieldErrors.telephoneNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                                        />
                                        {showAdditionalPhone && (
                                            <div className="mt-2 relative">
                                                <Input
                                                    placeholder="Telephone Number 2"
                                                    ref={(el) => (form1Ref.current.telephoneNumber2 = el)}
                                                    onChange={handleInputChange('telephoneNumber')}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                                                    onClick={() => setShowAdditionalPhone(false)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        {fieldErrors.telephoneNumber && (
                                            <p className="text-red-600 text-sm mt-1 flex items-center">
                                                <span className="mr-1">⚠</span> {fieldErrors.telephoneNumber}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="faxNumber">Fax Number</Label>
                                        <Input
                                            id="faxNumber"
                                            placeholder="Enter fax number"
                                            ref={(el) => (form1Ref.current.faxNumber = el)}
                                            defaultValue=""
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email" className={fieldErrors.email ? "text-red-600" : ""}>
                                            E-mail <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter valid email address"
                                            ref={(el) => (form1Ref.current.email = el)}
                                            defaultValue=""
                                            onChange={handleEmailChange}
                                            className={fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                                            required
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-red-600 text-sm mt-1 flex items-center">
                                                <span className="mr-1">⚠</span> {fieldErrors.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                        <div className="flex items-center mb-6">
                            <Checkbox
                                id="agreeToTerms"
                                checked={agreeToTerms}
                                onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                            />
                            <Label htmlFor="agreeToTerms" className="ml-2">
                                I agree to Privacy Policy and Terms of Agreement
                            </Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sticky bottom-0 bg-white py-4">
                            <Button disabled={isSubmitting} variant="outline" className="w-full" onClick={() => setAmendVisible(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                type="submit"
                                className={cn(
                                    'w-full',
                                    isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                )}
                                disabled={isSubmitting}               // ← DISABLED
                            >
                                {isSubmitting ? 'Submitting…' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}
