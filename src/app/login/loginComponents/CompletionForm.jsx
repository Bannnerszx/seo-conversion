"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



    export const countries = [
        { code: "US", name: "United States" },
        { code: "CA", name: "Canada" },
        { code: "GB", name: "United Kingdom" },
        { code: "AU", name: "Australia" },
        { code: "DE", name: "Germany" },
        { code: "FR", name: "France" },
        { code: "JP", name: "Japan" },
        { code: "CN", name: "China" },
        { code: "IN", name: "India" },
        { code: "BR", name: "Brazil" },
        { code: "MX", name: "Mexico" },
        { code: "IT", name: "Italy" },
        { code: "ES", name: "Spain" },
        { code: "NL", name: "Netherlands" },
        { code: "SE", name: "Sweden" },
        { code: "NO", name: "Norway" },
        { code: "DK", name: "Denmark" },
        { code: "FI", name: "Finland" },
        { code: "SG", name: "Singapore" },
        { code: "KR", name: "South Korea" },
        { code: "ZA", name: "South Africa" },
        { code: "AE", name: "United Arab Emirates" },
        { code: "SA", name: "Saudi Arabia" },
        { code: "CH", name: "Switzerland" },
        { code: "NZ", name: "New Zealand" },
        // Add more countries as needed
      ]
      


export function ProfileCompletionForm({ email, missingFields, onSubmit }) {
  const [formData, setFormData] = useState({
    email,
    firstName: "",
    lastName: "",
    phoneNumber: "",
    country: "",
    city: "",
    street: "",
    zipcode: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (missingFields.includes("firstName") && !formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (missingFields.includes("lastName") && !formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (missingFields.includes("phoneNumber") && !formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (missingFields.includes("country") && !formData.country) {
      newErrors.country = "Country is required";
    }

    if (missingFields.includes("city") && !formData.city) {
      newErrors.city = "City is required";
    }

    if (missingFields.includes("street") && !formData.street) {
      newErrors.street = "Street address is required";
    }

    if (missingFields.includes("zipcode") && !formData.zipcode) {
      newErrors.zipcode = "Zip code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-[#0000ff]">Complete Your Profile</h1>
        <p className="text-gray-500">We need a few more details to complete your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" value={formData.email} disabled className="bg-gray-50" />
        </div>

        {missingFields.includes("textFirst") && (
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
          </div>
        )}

        {missingFields.includes("textLast") && (
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
          </div>
        )}

        {missingFields.includes("textPhoneNumber") && (
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={errors.phoneNumber ? "border-red-500" : ""}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
          </div>
        )}

        {missingFields.includes("country") && (
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={(value) => handleSelectChange(value, "country")}>
              <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
          </div>
        )}

        {missingFields.includes("city") && (
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
          </div>
        )}

        {missingFields.includes("textStreet") && (
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              className={errors.street ? "border-red-500" : ""}
            />
            {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
          </div>
        )}

        {missingFields.includes("textZip") && (
          <div className="space-y-2">
            <Label htmlFor="zipcode">Zip Code</Label>
            <Input
              id="zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
              className={errors.zipcode ? "border-red-500" : ""}
            />
            {errors.zipcode && <p className="text-red-500 text-sm">{errors.zipcode}</p>}
          </div>
        )}

        <Button type="submit" className="w-full bg-[#0000ff] hover:bg-blue-700 py-5 mt-6">
          Complete Profile
        </Button>
      </form>
    </div>
  );
}
