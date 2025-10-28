"use client"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import { useState, useRef } from "react"
import { X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Modal from "@/app/components/Modal"
import { VirtualizedCombobox } from "@/app/components/VirtualizedCombobox"
import { cn } from "@/lib/utils"
import { docDelivery, getCities } from "@/app/actions/actions"

// Sample customer data for demonstration

export default function DocumentAddress({ accountData, countryList, setOrderModal, chatId, userEmail }) {

    // Initialize refs for form data
    const [useCustomerInfo, setUseCustomerInfo] = useState(false)
    const [copyFromForm1, setCopyFromForm1] = useState(false)
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
        // Enforce agreeToTerms checkbox
        if (!agreeToTerms) {
            validationErrors.push('You must agree to the terms and privacy policy');
            setFieldErrors(prev => ({ ...prev, agreeToTerms: 'You must agree to the terms and privacy policy' }));
        }

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
    //number only for telephones
    const allowOnlyDigitKeys = (e) => {
        const allowed = [
            "Backspace", "Delete", "ArrowLeft", "ArrowRight",
            "Tab", "Home", "End"
        ];
        if (allowed.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault(); // block non-digits
    };

    const sanitizePasteToDigits = (e) => {
        const text = (e.clipboardData || window.clipboardData).getData("text");
        const digits = text.replace(/\D+/g, "");
        e.preventDefault();
        const target = e.target;
        const start = target.selectionStart ?? target.value.length;
        const end = target.selectionEnd ?? target.value.length;
        const next = target.value.slice(0, start) + digits + target.value.slice(end);
        // Update the value and move caret
        target.value = next;
        // Trigger React onChange so your form state updates
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(target, next);
        target.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const handleNumericChange =
        (origOnChange) =>
            (e) => {
                // extra safety if something slips through (e.g., autofill)
                const digitsOnly = e.target.value.replace(/\D+/g, "");
                if (digitsOnly !== e.target.value) {
                    e.target.value = digitsOnly;
                    // Fire input event so React sees the change
                    e.target.dispatchEvent(new Event('input', { bubbles: true }));
                }
                origOnChange?.(e);
            };
    //number only
    return (
        <>
            <Button
                onClick={() => setAmendVisible(true)}
                variant="default" className="gap-2 bg-green-50 text-green-600 border-green-200 hover:bg-green-100">
                <MapPin className="h-4 w-4" />
                <span>Add Delivery Address</span>
            </Button>
            <Modal context={'documentAddress'} showModal={amendVisible} setShowModal={setAmendVisible}>
                <div className="max-h-[85vh] overflow-y-auto">
                    <div className="container mx-auto py-4 px-4 max-w-3xl pb-24">
                        <Card className="mb-6">
                            <CardHeader className="border-b pb-4 sticky top-0 bg-white z-10 rounded-t-lg">
                                <div className="relative flex items-center justify-center">
                                    <CardTitle className="text-center text-blue-600 text-lg sm:text-xl">
                                        Document Delivery Information
                                    </CardTitle>

                                    <button
                                        type="button"
                                        onClick={() => setAmendVisible(false)}
                                        aria-label="Close"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <span className="block text-2xl leading-none">&times;</span>
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div>
                                    <h2 className="text-base sm:text-lg font-semibold mb-4">Customer Information</h2>

                                    <div className="flex items-start gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <Checkbox
                                            id="useCustomerInfo"
                                            checked={useCustomerInfo}
                                            onCheckedChange={handleUseCustomerInfo}
                                            className="mt-0.5"
                                        />
                                        <Label htmlFor="useCustomerInfo" className="text-sm leading-relaxed cursor-pointer">
                                            Set as customer&apos;s information <span className="text-red-500">*</span>
                                        </Label>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Full Name */}
                                    <div>
                                        <Label
                                            htmlFor="fullName"
                                            className={cn("text-sm font-medium", fieldErrors.fullName && "text-red-600")}
                                        >
                                            Full Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="fullName"
                                            placeholder="Enter full name"
                                            ref={(el) => {
                                                if (el) form1Ref.current.fullName = el
                                            }}
                                            defaultValue=""
                                            onChange={handleInputChange("fullName")}
                                            className={cn("mt-1.5 h-11", fieldErrors.fullName && "border-red-500 focus-visible:ring-red-500")}
                                            required
                                        />
                                        {fieldErrors.fullName && (
                                            <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                                                <span>⚠</span> {fieldErrors.fullName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <Label
                                                htmlFor="country"
                                                className={cn("text-sm font-medium", fieldErrors.country && "text-red-600")}
                                            >
                                                Country <span className="text-red-500">*</span>
                                            </Label>
                                            <VirtualizedCombobox
                                                items={countryList}
                                                value={selectedCountry ? selectedCountry.isoCode : ""}
                                                onSelect={handleCountrySelectWithValidation}
                                                placeholder="Select Country"
                                                valueKey="isoCode"
                                                labelKey="name"
                                                className={cn("mt-1.5", fieldErrors.country && "border-red-500")}
                                                required
                                            />
                                            {fieldErrors.country && (
                                                <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                                                    <span>⚠</span> {fieldErrors.country}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="city" className={cn("text-sm font-medium", fieldErrors.city && "text-red-600")}>
                                                City <span className="text-red-500">*</span>
                                            </Label>
                                            <VirtualizedCombobox
                                                items={cityList}
                                                value={selectedCity}
                                                onSelect={handleCitySelectWithValidation}
                                                placeholder="Select City"
                                                className={cn("mt-1.5", fieldErrors.city && "border-red-500")}
                                                required
                                            />
                                            {fieldErrors.city && (
                                                <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                                                    <span>⚠</span> {fieldErrors.city}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <Label htmlFor="address" className={cn("text-sm font-medium", fieldErrors.address && "text-red-600")}>
                                            Address <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="address"
                                            placeholder="Enter full address"
                                            ref={(el) => (form1Ref.current.address = el)}
                                            defaultValue=""
                                            onChange={handleInputChange("address")}
                                            className={cn("mt-1.5 h-11", fieldErrors.address && "border-red-500 focus-visible:ring-red-500")}
                                            required
                                        />
                                        {fieldErrors.address && (
                                            <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                                                <span>⚠</span> {fieldErrors.address}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                                            <Label
                                                htmlFor="telephoneNumber"
                                                className={cn("text-sm font-medium", fieldErrors.telephoneNumber && "text-red-600")}
                                            >
                                                Telephone Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-9 text-blue-600 border-blue-600 hover:bg-blue-50 w-full sm:w-auto bg-transparent"
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
                                            type="text"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            autoComplete="tel"
                                            onKeyDown={allowOnlyDigitKeys}
                                            onPaste={sanitizePasteToDigits}
                                            onChange={handleNumericChange(handleInputChange("telephoneNumber"))}
                                            className={cn("h-11", fieldErrors.telephoneNumber && "border-red-500 focus-visible:ring-red-500")}
                                        />

                                        {showAdditionalPhone && (
                                            <div className="mt-3 relative">
                                                <Input
                                                    id="telephoneNumber2"
                                                    placeholder="Telephone Number 2"
                                                    ref={(el) => (form1Ref.current.telephoneNumber2 = el)}
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="\d*"
                                                    autoComplete="tel"
                                                    onKeyDown={allowOnlyDigitKeys}
                                                    onPaste={sanitizePasteToDigits}
                                                    onChange={handleNumericChange(handleInputChange("telephoneNumber2"))}
                                                    className="h-11 pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                    onClick={() => setShowAdditionalPhone(false)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        {fieldErrors.telephoneNumber && (
                                            <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                                                <span>⚠</span> {fieldErrors.telephoneNumber}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <Label htmlFor="email" className={cn("text-sm font-medium", fieldErrors.email && "text-red-600")}>
                                            E-mail <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter valid email address"
                                            ref={(el) => (form1Ref.current.email = el)}
                                            defaultValue=""
                                            onChange={handleEmailChange}
                                            className={cn("mt-1.5 h-11", fieldErrors.email && "border-red-500 focus-visible:ring-red-500")}
                                            required
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1">
                                                <span>⚠</span> {fieldErrors.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-lg border">
                            <Checkbox
                                id="agreeToTerms"
                                checked={agreeToTerms}
                                aria-required="true"
                                onCheckedChange={(checked) => { setAgreeToTerms(checked === true); if (checked === true) clearFieldError('agreeToTerms'); }}
                                className="mt-0.5"
                            />

                            <Label htmlFor="terms" className="text-sm pt-0.5">
                                I agree to{" "}
                                <a
                                    href="/privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    Privacy Policy
                                </a>{" "}
                                and{" "}
                                <a
                                    href="/terms-of-use"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    Terms of Agreement
                                </a>

                            </Label>
                            {/* Inline error for agreeToTerms */}
                            {fieldErrors.agreeToTerms && (
                                <p className="text-red-600 text-sm mt-2">
                                    ⚠ {fieldErrors.agreeToTerms}
                                </p>
                            )}
                        </div>
                        <div className="bg-white">
                            <div className="container mx-auto max-w-3xl px-4 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        disabled={isSubmitting}
                                        variant="outline"
                                        className="w-full h-11 bg-transparent"
                                        onClick={() => setAmendVisible(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        type="submit"
                                        className={cn(
                                            "h-11 font-medium",
                                            isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700",
                                            !agreeToTerms && !isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                                        )}
                                        disabled={isSubmitting || !agreeToTerms}
                                    >
                                        {isSubmitting ? "Submitting…" : "Confirm"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </Modal>
        </>
    )
}
