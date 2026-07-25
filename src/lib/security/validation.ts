import { z } from "zod";

// Password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// User Authentication Validation Schemas
export const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const SignUpSchema = z.object({
  displayName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid mobile number."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(
      strongPasswordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  agreeTerms: z.boolean().refine((val) => val === true, "You must agree to the Terms."),
});

// Booking Initiation Schema
export const InitiateBookingSchema = z.object({
  booking_type: z.enum(["flight", "hotel", "tour", "visa"]),
  reference_id: z.string().optional(),
  total_price: z.number().positive("Total price must be greater than 0."),
  customer_name: z.string().min(2, "Passenger name is required."),
  customer_email: z.string().email("Valid email is required."),
  customer_phone: z.string().min(10, "Valid phone number is required."),
  details: z.record(z.string(), z.any()),
});

// Inquiry Submission Schema
export const InquirySchema = z.object({
  type: z.enum(["visa", "tour"]),
  name: z.string().min(2, "Name is required."),
  phone: z.string().min(10, "Valid phone number is required."),
  email: z.string().email("Valid email is required."),
  details: z.string().min(5, "Please provide inquiry details."),
});
