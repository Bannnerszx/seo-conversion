'use client'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Car } from "lucide-react"

const COLORS = [
    { name: "Black", value: "Black", bg: "bg-black", type: "solid" },
    { name: "White", value: "White", bg: "bg-white", type: "solid", border: true },
    {
        name: "Pearl White",
        value: "Pearl",
        bg: "bg-gradient-to-br from-white via-blue-50 to-gray-100",
        type: "metallic",
        border:true
    },
    {name: "Silver"}
]