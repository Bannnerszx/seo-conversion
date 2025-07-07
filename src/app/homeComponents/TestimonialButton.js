"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TestimonialButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [testimonial, setTestimonial] = useState("");
  const [rating, setRating] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    // Here you would typically send the testimonial to your backend

    setIsOpen(false);
    setTestimonial("");
    setRating("");
  };

  return (
    <div className="p-4 bg-blue-100 rounded-lg max-w-md mx-auto">
      <p className="mb-4">Thank you for your purchase! We'd love to hear your feedback.</p>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Write a Testimonial</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Write Your Testimonial</DialogTitle>
            <DialogDescription>
              Share your experience with our product. Your feedback is valuable to us!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rating" className="text-right">
                  Rating
                </Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  className="col-span-3"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="Rate from 1-5"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="testimonial" className="text-right">
                  Testimonial
                </Label>
                <Textarea
                  id="testimonial"
                  className="col-span-3"
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                  placeholder="Write your testimonial here"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
                Submit Testimonial
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
