"use client"
import moment from "moment"
import { useState, useRef } from "react"
import { X, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Modal from "@/app/components/Modal"
import { getCities, updateInvoice } from "@/app/actions/actions"
import { VirtualizedCombobox } from "@/app/components/VirtualizedCombobox"
import { cn } from "@/lib/utils"
// Sample customer data for demonstration

export default function InvoiceAmendmentForm({ accountData, countryList, setOrderModal, chatId, userEmail }) {
  // Initialize refs for form data

  // Customer sample data for form prefill

  const [useCustomerInfo, setUseCustomerInfo] = useState(false)
  const [copyFromForm1, setCopyFromForm1] = useState(true)
  const [showAdditionalPhone, setShowAdditionalPhone] = useState(false)
  const [showAdditionalPhone2, setShowAdditionalPhone2] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [amendVisible, setAmendVisible] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState("")
  const [errors, setErrors] = useState({});
  // Form refs (for uncontrolled components)
  const form1Ref = useRef({})
  const form2Ref = useRef({})

  // Countries state (for dropdown options)
  const [countries] = useState(countryList)

  // City list for customer form
  const [cityList, setCityList] = useState([])

  // Billing city list for form2
  const [billingCityList, setBillingCityList] = useState([])

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
      // Fill non-controlled form fields
      Object.keys(sampleCustomerData).forEach((key) => {
        if (key === "country" || key === "city") return;
        if (form1Ref.current[key] && typeof form1Ref.current[key] === "object") {
          form1Ref.current[key].value = sampleCustomerData[key] || "";
        }
      });

      // Set selected country
      const country = sampleCustomerData.country;
      setSelectedCountry(country);
      form1Ref.current.country = country;

      // Fetch cities and set selected city
      if (country && country.isoCode) {
        getCities(country.isoCode)
          .then((cities) => {
            setCityList(cities);

            const matchedCity = cities.find((c) => c.name === sampleCustomerData.city);
            const finalCity = matchedCity || sampleCustomerData.city || "";

            setTimeout(() => {
              setSelectedCity(finalCity);
              form1Ref.current.city = finalCity;
            }, 10);
          })
          .catch((err) => {
            console.error("Error fetching cities:", err);
            setCityList([]);
            setTimeout(() => {
              const fallbackCity = sampleCustomerData.city || "";
              setSelectedCity(fallbackCity);
              form1Ref.current.city = fallbackCity;
            }, 10);
          });
      }
    } else {
      // Reset form fields and state on uncheck
      Object.keys(form1Ref.current).forEach((key) => {
        if (form1Ref.current[key] && typeof form1Ref.current[key] === "object") {
          form1Ref.current[key].value = "";
        }
      });

      setSelectedCity("");
      setSelectedCountry(null);
    }
  };

  // Handle copying data from customer form (form1) to billing form (form2)
  const handleCopyFromForm1 = (checked) => {
    setCopyFromForm1(checked);
    if (checked) {

      // Copy basic text fields from Form 1 to Form 2.
      const formFields = ["fullName", "address", "telephoneNumber", "faxNumber", "email"];
      formFields.forEach(key => {
        if (
          form1Ref.current[key] &&
          form1Ref.current[key].value !== undefined &&
          form2Ref.current[key]
        ) {
          form2Ref.current[key].value = form1Ref.current[key].value;
        }
      });

      // For telephoneNumber2: if it exists and has a non-empty value,
      // ensure the additional phone input shows, and copy its value when available.
      if (
        form1Ref.current.telephoneNumber2 &&
        form1Ref.current.telephoneNumber2.value.trim() !== ""
      ) {
        setShowAdditionalPhone2(true);
        // Use a short delay to allow the billing input to render.
        setTimeout(() => {
          if (form2Ref.current.telephoneNumber2) {
            form2Ref.current.telephoneNumber2.value = form1Ref.current.telephoneNumber2.value;
          }
        }, 0);
      } else {
        setShowAdditionalPhone2(false);
      }

      // Copy country and city using state values.
      if (selectedCountry) {
        form2Ref.current.country = selectedCountry;
        setSelectedBillingCountry(selectedCountry);
        // Immediately fetch billing cities for the selected country.
        getCities(selectedCountry.isoCode)
          .then(cities => {
            setBillingCityList(cities);
            setSelectedBillingCity(selectedCity);
            form2Ref.current.city = selectedCity;
          })
          .catch(err => {
            console.error("Error fetching billing cities:", err);
            setBillingCityList([]);
          });
      }
    } else {
      // Clear Form 2 input fields (only for elements that support .value).
      Object.keys(form2Ref.current).forEach(key => {
        if (form2Ref.current[key] && typeof form2Ref.current[key].value === "string") {
          form2Ref.current[key].value = '';
        }
      });
      setSelectedBillingCountry(null);
      setSelectedBillingCity("");
      setBillingCityList([]);
      setShowAdditionalPhone2(false);
    }
  };


  // --- Form 1 (Customer Information) State ---

  // Selected country and city for customer form

  // When a country is selected in Form 1

  const handleCountrySelect = (isoCode) => {
    const country = countries.find(c => c.isoCode === isoCode);
    setSelectedCountry(country);
    form1Ref.current.country = country;

    getCities(country.isoCode)
      .then(cities => {
        if (cities.length > 0) {
          // Normal case
          setCityList(cities);
          setSelectedCity("");
          form1Ref.current.city = "";
        } else {
          // No cities → default to "Others"
          setCityList(["Others"]);
          setSelectedCity("Others");
          form1Ref.current.city = "Others";
          // clear any validation error on the city field
          setErrors(prev => ({ ...prev, city: false }));
        }
      })
      .catch(err => {
        console.error("Error fetching cities:", err);
        // On error also default
        setCityList(["Others"]);
        setSelectedCity("Others");
        form1Ref.current.city = "Others";
        setErrors(prev => ({ ...prev, city: false }));
      });
  };


  const handleBillingCountrySelect = (isoCode) => {
    const country = countries.find(c => c.isoCode === isoCode);
    setSelectedBillingCountry(country);
    form2Ref.current.country = country;

    getCities(country.isoCode)
      .then(cities => {
        if (cities.length > 0) {
          // Normal case
          setBillingCityList(cities);
          setSelectedBillingCity("");
          form2Ref.current.city = "";
        } else {
          // No cities → default to "Others"
          setBillingCityList(["Others"]);
          setSelectedBillingCity("Others");
          form2Ref.current.city = "Others";
          // clear any validation error on the billing-city field
          setErrors(prev => ({ ...prev, form2_city: false }));
        }
      })
      .catch(err => {
        console.error("Error fetching billing cities:", err);
        // On error also default
        setBillingCityList(["Others"]);
        setSelectedBillingCity("Others");
        form2Ref.current.city = "Others";
        setErrors(prev => ({ ...prev, form2_city: false }));
      });
  };

  const handleCitySelect = (cityValue) => {
    setSelectedCity(cityValue)
    form1Ref.current.city = cityValue
  }

  // --- Form 2 (Billing Information) State ---

  // Selected country and city for billing form
  const [selectedBillingCountry, setSelectedBillingCountry] = useState(null)
  const [selectedBillingCity, setSelectedBillingCity] = useState("")

  // When a country is selected in the billing form


  const handleBillingCitySelect = (cityValue) => {
    setSelectedBillingCity(cityValue)
    form2Ref.current.city = cityValue
  }
  const getInputClass = (hasError) =>
    cn(
      'block w-full rounded-md px-3 py-2 text-sm transition',
      {
        'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500':
          !hasError,
        'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 animate-shake':
          hasError,
      }
    );
  const getErrorOnlyClass = (hasError) =>
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 animate-shake'
      : '';
  // Handle form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);                     // ← START LOADING

    // 1) Batch-validate Form 1 required fields
    const required1 = [
      'fullName',
      'country',       // ← add this
      'address',
      'telephoneNumber',
      'email',
      'city'
    ];
    const required2 = [
      'fullName',
      'country',       // ← add this
      'address',
      'telephoneNumber',
      'email',
      'city'
    ];
    const newErrors = {};
    required1.forEach((id) => {
      if (id === 'country') {
        // for combobox we check selectedCountry
        newErrors.country = !selectedCountry;
      } else if (id === 'city') {
        newErrors.city = !selectedCity;
      } else {
        const val = form1Ref.current[id]?.value ?? '';
        newErrors[id] = !val.trim();
      }
    });
    if (!copyFromForm1) {
      required2.forEach((id) => {
        if (id === 'country') {
          // for combobox we check selectedCountry
          newErrors['form2_country'] = !selectedBillingCountry;
        } else if (id === 'city') {
          newErrors['form2_city'] = !selectedBillingCity;
        } else {
          const val = form2Ref.current[id]?.value ?? '';
          newErrors[`form2_${id}`] = !val.trim();
        }
      });
    }
    setErrors(newErrors);

    // 2) If any errors, bail out
    if (Object.values(newErrors).some(Boolean)) {
      setIsSubmitting(false);

      return;
    }

    // 3) All good → run your fetches
    try {
      const [ipResp, timeResp] = await Promise.all([
        fetch(
          'https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo'
        ),
        fetch(
          'https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time'
        ),
      ]);
      const [ipInfo, tokyoTime] = await Promise.all([
        ipResp.json(),
        timeResp.json(),
      ]);
      const momentDate = moment(
        tokyoTime?.datetime,
        'YYYY/MM/DD HH:mm:ss.SSS'
      );
      const formattedTime = momentDate.format('YYYY/MM/DD [at] HH:mm:ss');

      // Build phone arrays
      const telephoneNumbersForm1 = [];
      const t1 = form1Ref.current.telephoneNumber?.value?.trim() ?? '';
      if (t1) telephoneNumbersForm1.push(t1);

      const t2 = form1Ref.current.telephoneNumber2?.value?.trim() ?? '';
      if (t2) telephoneNumbersForm1.push(t2);

      // Form 2
      const telephoneNumbersForm2 = [];
      const b1 = form2Ref.current.telephoneNumber?.value?.trim() ?? '';
      if (b1) telephoneNumbersForm2.push(b1);

      const b2 = form2Ref.current.telephoneNumber2?.value?.trim() ?? '';
      if (b2) telephoneNumbersForm2.push(b2);
      // Collect data objects
      const form1Data = {
        fullName: form1Ref.current.fullName.value,
        country: selectedCountry?.name ?? '',
        city: selectedCity,
        address: form1Ref.current.address.value,
        telephoneNumber: telephoneNumbersForm1,
        faxNumber: form1Ref.current.faxNumber.value,
        email: form1Ref.current.email.value,
      };
      const form2Data = {
        fullName: form2Ref.current.fullName?.value ?? '',
        country: selectedBillingCountry?.name ?? '',
        city: selectedBillingCity ?? '',
        address: form2Ref.current.address?.value ?? '',
        telephoneNumber: telephoneNumbersForm2 ?? '',
        faxNumber: form2Ref.current.faxNumber?.value ?? '',
        email: form2Ref.current.email?.value ?? '',
      };

      const result = await updateInvoice(
        form1Data,
        form2Data,
        chatId,
        userEmail,
        useCustomerInfo,
        copyFromForm1,
        ipInfo,
        formattedTime
      );
      console.log('Server returned:', result);
      setIsSubmitting(false);

    } catch (error) {
      console.error('Error calling server action:', error);
    } finally {
      setAmendVisible(false);
      setIsSubmitting(false);                     // ← START LOADING

    }
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    setErrors((prev) => ({ ...prev, [id]: !value.trim() }));
  };

  return (
    <>
      <Button
        onClick={() => { setAmendVisible(true) }}
        variant="default"
        className="gap-2 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
      >
        <Edit className="h-4 w-4" />
        <span>Amend Invoice</span>
      </Button>

      <Modal showModal={amendVisible} setShowModal={setAmendVisible}>
        <div className="max-h-[85vh] overflow-y-auto z-[9999]">
          <form onSubmit={handleSubmit} className="container mx-auto py-6 px-4 max-w-3xl">

            <Card className="mb-6">
              <CardHeader className="border-b pb-3 sticky top-0 bg-white z-10">
                <CardTitle className="text-center text-blue-600">
                  Request Invoice Amendment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-2">Consignee Information</h2>

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
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter full name"
                      defaultValue=""
                      ref={(el) => (form1Ref.current.fullName = el)}
                      className={getInputClass(errors.fullName)}
                      onBlur={handleBlur}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <VirtualizedCombobox
                        items={countryList}
                        value={selectedCountry ? selectedCountry.isoCode : ""}
                        onSelect={(c) => {
                          handleCountrySelect(c);
                          setErrors(prev => ({ ...prev, country: false }));
                        }}
                        placeholder="Select Country"
                        valueKey="isoCode"
                        labelKey="name"
                        className={getErrorOnlyClass(errors.country)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <VirtualizedCombobox
                        items={cityList}
                        value={selectedCity}
                        onSelect={(c) => {
                          handleCitySelect(c);
                          setErrors(prev => ({ ...prev, city: false }));
                        }}
                        placeholder="Select City"
                        className={getErrorOnlyClass(errors.city)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter full address"
                      defaultValue=""
                      ref={(el) => (form1Ref.current.address = el)}
                      className={getInputClass(errors.address)}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="telephoneNumber">Telephone Number</Label>
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
                      defaultValue=""
                      ref={(el) => (form1Ref.current.telephoneNumber = el)}
                      className={getInputClass(errors.telephoneNumber)}
                      onBlur={handleBlur}
                    />
                    {showAdditionalPhone && (
                      <div className="mt-2 relative">
                        <Input
                          placeholder="Telephone Number 2"
                          ref={(el) => (form1Ref.current.telephoneNumber2 = el)}
                          className="block w-full rounded-md border-gray-300 px-3 py-2 text-sm"
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
                  </div>
                  <div>
                    <Label htmlFor="faxNumber">Fax Number</Label>
                    <Input
                      id="faxNumber"
                      placeholder="Enter fax number"
                      defaultValue=""
                      ref={(el) => (form1Ref.current.faxNumber = el)}
                      className={getInputClass(errors.faxNumber)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter full email"
                      ref={(el) => (form1Ref.current.email = el)}
                      defaultValue=""
                      className={getInputClass(errors.email)}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information Form (Form 2) */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-2">Notify Party</h2>

                <div className="flex items-center mb-4">
                  <Checkbox
                    id="copyFromForm1"
                    checked={copyFromForm1}
                    onCheckedChange={handleCopyFromForm1}
                  />
                  <Label htmlFor="copyFromForm1" className="ml-2">
                    Same as consignee
                  </Label>
                </div>
                {copyFromForm1 === false && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName2">Full Name</Label>
                      <Input
                        id="fullName2"
                        placeholder="Enter full name"
                        ref={(el) => {
                          if (el) form2Ref.current.fullName = el
                        }}
                        defaultValue=""
                        className={getInputClass(errors['form2_fullName'])}
                        onBlur={copyFromForm1 ? undefined : handleBlur}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country2">Country</Label>
                        <VirtualizedCombobox
                          items={countryList}
                          value={selectedBillingCountry ? selectedBillingCountry.isoCode : ""}
                          onSelect={(c) => {
                            handleBillingCountrySelect(c);
                            setErrors(prev => ({ ...prev, form2_country: false }));
                          }}
                          placeholder="Select Country"
                          valueKey="isoCode"
                          labelKey="name"
                          className={getErrorOnlyClass(errors['form2_country'])}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city2">City</Label>
                        <VirtualizedCombobox
                          items={billingCityList}
                          value={selectedBillingCity}
                          onSelect={(city) => {
                            handleBillingCitySelect(city);
                            setErrors(prev => ({ ...prev, form2_city: false }));
                          }}
                          placeholder="Select City"
                          className={getErrorOnlyClass(errors.form2_country)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address2">Address</Label>
                      <Input
                        id="address2"
                        placeholder="Enter full address"
                        ref={(el) => {
                          if (el) form2Ref.current.address = el
                        }}
                        defaultValue=""
                        className={getInputClass(errors['form2_address'])}
                        onBlur={copyFromForm1 ? undefined : handleBlur}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="telephoneNumber2">Telephone Number</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-blue-600 border-blue-600"
                          onClick={() => setShowAdditionalPhone2(true)}
                        >
                          + Add Telephone
                        </Button>
                      </div>
                      <Input
                        id="telephoneNumber2"
                        placeholder="Telephone Number 1"
                        ref={(el) => {
                          if (el) form2Ref.current.telephoneNumber = el
                        }}
                        defaultValue=""
                        className={getInputClass(errors['form2_telephoneNumber'])}
                        onBlur={copyFromForm1 ? undefined : handleBlur}
                      />
                      {showAdditionalPhone2 && (
                        <div className="mt-2 relative">
                          <Input
                            placeholder="Telephone Number 2"
                            ref={(el) => {
                              if (el) form2Ref.current.telephoneNumber2 = el
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => setShowAdditionalPhone2(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="faxNumber2">Fax Number</Label>
                      <Input
                        id="faxNumber2"
                        placeholder="Enter fax number"
                        ref={(el) => {
                          if (el) form2Ref.current.faxNumber = el
                        }}
                        defaultValue=""
                      />
                    </div>
                    <div>
                      <Label htmlFor="email2">E-mail</Label>
                      <Input
                        id="email2"
                        type="email"
                        placeholder="Enter email"
                        ref={(el) => {
                          if (el) form2Ref.current.email = el
                        }}
                        defaultValue=""
                        className={getInputClass(errors['form2_email'])}
                        onBlur={copyFromForm1 ? undefined : handleBlur}
                      />
                    </div>
                  </div>
                )}

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
              <Button disabled={isSubmitting} type="cancel" variant="outline" className="w-full" onClick={() => setAmendVisible(false)}>
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
          </form>
        </div>
      </Modal>
    </>
  )
}
