"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function ReviewStep({
    paymentData,
    onBack,
    onSubmit,            // <- back to your original prop name
    isSubmitting = false,
}) {
    const [consent, setConsent] = useState({
        deliveryScope: false,
        conditionAccept: false,
        refundFx: false,
        noAddressChange: false,
        eSign: false,
    });

    const allChecked = useMemo(() => Object.values(consent).every(Boolean), [consent]);
    const someChecked = useMemo(() => Object.values(consent).some(Boolean), [consent]);
    const masterChecked = allChecked ? true : someChecked ? "indeterminate" : false;

    const onToggle = (key) => (checked) =>
        setConsent((c) => ({ ...c, [key]: Boolean(checked) }));

    const onToggleAll = (checked) => {
        const val = Boolean(checked);
        setConsent({
            deliveryScope: val,
            conditionAccept: val,
            refundFx: val,
            noAddressChange: val,
            eSign: val,
        });
    };

    const confirm = () => {
        if (!allChecked || isSubmitting) return;
        // send consent up exactly like before, just via onSubmit
        onSubmit?.({ consent });
    };

    return (
        <div className="flex flex-col p-4 sm:p-6 gap-4 h-full">
            <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">Review &amp; Confirm</h3>
                <p className="text-sm text-muted-foreground">
                    Please review your information before submitting.
                </p>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0">
                <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                            <p className="text-base text-foreground break-all">{paymentData?.email}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Signature</p>
                            <div className="rounded-md border border-border bg-background p-3">
                                <img
                                    src={paymentData?.signature || "/placeholder.svg"}
                                    alt="Your signature"
                                    className="w-full h-24 object-contain"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Master consent */}
                    <div className="rounded-lg border border-[#0070BA]/40 bg-[#0070BA]/5 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="allConsent"
                                checked={masterChecked}
                                onCheckedChange={onToggleAll}
                            />
                            <Label htmlFor="allConsent" className="text-sm leading-5 font-semibold">
                                I consent to everything listed below.
                            </Label>
                        </div>

                        <div className="pl-6 space-y-3">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="deliveryScope"
                                    checked={consent.deliveryScope}
                                    onCheckedChange={onToggle("deliveryScope")}
                                />
                                <Label htmlFor="deliveryScope" className="text-sm leading-5">
                                    Delivery ends at <span className="font-medium">Port of Dar es Salaam, Tanzania</span>.
                                    Inland transport/risks after discharge are the buyer’s responsibility.
                                </Label>
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="conditionAccept"
                                    checked={consent.conditionAccept}
                                    onCheckedChange={onToggle("conditionAccept")}
                                />
                                <Label htmlFor="conditionAccept" className="text-sm leading-5">
                                    I reviewed the specs/photos and accept the vehicle’s described condition.
                                </Label>
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="refundFx"
                                    checked={consent.refundFx}
                                    onCheckedChange={onToggle("refundFx")}
                                />
                                <Label htmlFor="refundFx" className="text-sm leading-5">
                                    I understand the refund policy. Refunds (if any) return to the original funding source
                                    and use the refund-day exchange rate/fees.
                                </Label>
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="noAddressChange"
                                    checked={consent.noAddressChange}
                                    onCheckedChange={onToggle("noAddressChange")}
                                />
                                <Label htmlFor="noAddressChange" className="text-sm leading-5">
                                    I agree not to request any change of delivery address after payment.
                                </Label>
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="eSign"
                                    checked={consent.eSign}
                                    onCheckedChange={onToggle("eSign")}
                                />
                                <Label htmlFor="eSign" className="text-sm leading-5">
                                    I consent to use of electronic records and electronic signatures.
                                </Label>
                            </div>

                            {!allChecked && (
                                <p className="text-xs text-muted-foreground pt-1">
                                    Please check all boxes (or the master consent) to enable payment.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg bg-[#0070BA]/10 border border-[#0070BA]/20 p-4">
                        <p className="text-sm text-foreground">
                            By confirming, you authorize this payment and agree to the terms above.
                        </p>
                    </div>


                    {/* Sticky actions */}
                    <div className="flex gap-3 pt-1 sticky bottom-0 bg-background">
                        <Button
                            variant="outline"
                            onClick={onBack}
                            disabled={isSubmitting}
                            className="flex-1 h-12 font-semibold bg-transparent"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={confirm}
                            disabled={!allChecked || isSubmitting}
                            className="flex-1 h-12 bg-[#0070BA] hover:bg-[#005EA6] text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" /> : "Confirm Payment"}
                        </Button>
                    </div>
                </div>
            </div>


        </div>
    );
}
