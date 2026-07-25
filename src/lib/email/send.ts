// src/lib/email/send.ts
// Resend API email sender — pure REST, no npm package needed

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Resend's onboarding domain works without custom domain verification.
// Once isbahtravels.com is verified in your Resend dashboard,
// change this back to: "Isbah Travels <noreply@isbahtravels.com>"
const FROM_ADDRESS = "Isbah Travels <onboarding@resend.dev>";

/**
 * Send transactional email via Resend REST API.
 * Requires RESEND_API_KEY in environment variables.
 * Falls back gracefully (logs only) if key is missing — safe for dev/local.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === "re_placeholder") {
    // In dev without a Resend key — log the email content and return success
    console.log("📧 [Email Dev Preview]");
    console.log("   To:", options.to);
    console.log("   Subject:", options.subject);
    console.log("   (Set RESEND_API_KEY in .env.local to send real emails)");
    return { success: true, id: `dev-preview-${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || FROM_ADDRESS,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend API error:", response.status, errorBody);
      return { success: false, error: `Resend API ${response.status}: ${errorBody}` };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error("Email send error:", err);
    return { success: false, error: err.message };
  }
}

// Convenience wrappers for each email type
import {
  welcomeEmailTemplate,
  bookingConfirmedEmailTemplate,
  paymentFailedEmailTemplate,
  bookingCancelledEmailTemplate,
  bookingStatusUpdateEmailTemplate,
  WelcomeEmailData,
  BookingConfirmedEmailData,
  PaymentFailedEmailData,
  BookingStatusUpdateEmailData,
} from "./templates";

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<SendEmailResult> {
  return sendEmail({
    to: data.user_email,
    subject: "Welcome to Isbah Travels — Your Account is Ready ✈️",
    html: welcomeEmailTemplate(data),
  });
}

export async function sendBookingConfirmedEmail(data: BookingConfirmedEmailData): Promise<SendEmailResult> {
  return sendEmail({
    to: data.user_email,
    subject: `Booking Confirmed — #${data.booking_id} | Isbah Travels ✅`,
    html: bookingConfirmedEmailTemplate(data),
  });
}

export async function sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<SendEmailResult> {
  return sendEmail({
    to: data.user_email,
    subject: `Payment Failed — Booking #${data.booking_id} | Isbah Travels ⚠️`,
    html: paymentFailedEmailTemplate(data),
  });
}

export async function sendBookingCancelledEmail(data: PaymentFailedEmailData): Promise<SendEmailResult> {
  return sendEmail({
    to: data.user_email,
    subject: `Booking Cancelled — #${data.booking_id} | Isbah Travels`,
    html: bookingCancelledEmailTemplate(data),
  });
}

export async function sendBookingStatusUpdateEmail(data: BookingStatusUpdateEmailData): Promise<SendEmailResult> {
  return sendEmail({
    to: data.user_email,
    subject: `Booking Status Update — #${data.booking_id} | Isbah Travels`,
    html: bookingStatusUpdateEmailTemplate(data),
  });
}
