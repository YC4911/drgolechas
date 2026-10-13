import { Schema } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface TestimonialRecord {
  authorName: string;
  quote: string;
  attribution?: string;
  avatar?: string;
  approved: boolean;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const testimonialSchema = new Schema<TestimonialRecord>(
  {
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    quote: { type: String, required: true, trim: true, maxlength: 1000 },
    attribution: { type: String, trim: true, maxlength: 120 },
    avatar: { type: String, trim: true },
    approved: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

testimonialSchema.index({ approved: 1, displayOrder: 1 });

export const TestimonialModel = registerModel("Testimonial", testimonialSchema);
