// src/lib/email/templates.ts
// Server-side HTML email template generators for Isbah Travels

export interface WelcomeEmailData {
  user_name: string;
  user_email: string;
}

export interface BookingConfirmedEmailData {
  user_name: string;
  user_email: string;
  booking_id: string;
  booking_type: string;
  booking_title: string;
  total_price: number;
  transaction_id?: string;
  receipt_url?: string;
}

export interface PaymentFailedEmailData {
  user_name: string;
  user_email: string;
  booking_id: string;
  booking_type: string;
  total_price: number;
  reason?: string;
}

export interface BookingStatusUpdateEmailData {
  user_name: string;
  user_email: string;
  booking_id: string;
  booking_title: string;
  new_status: string;
  note?: string;
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Isbah Travels</title>
<style>
  body { margin:0; padding:0; background:#F8F9FA; font-family:'Inter',Arial,sans-serif; color:#1e293b; }
  .wrapper { max-width:600px; margin:32px auto; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0; }
  .header { background:#0A192F; padding:28px 32px; display:flex; align-items:center; gap:12px; }
  .header-logo { background:#1E3A5F; border-radius:12px; padding:8px 12px; }
  .header-brand { color:#ffffff; font-size:20px; font-weight:900; letter-spacing:-0.5px; }
  .header-brand span { color:#F7C948; }
  .header-tag { color:#94a3b8; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
  .body { padding:32px; }
  .greeting { font-size:22px; font-weight:900; color:#0A192F; margin-bottom:8px; }
  .subtext { font-size:14px; color:#64748b; font-weight:500; margin-bottom:24px; line-height:1.6; }
  .card { background:#F8F9FA; border-radius:14px; border:1px solid #e2e8f0; padding:20px 24px; margin:20px 0; }
  .card-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; }
  .card-row:last-child { border-bottom:none; }
  .card-label { color:#94a3b8; font-weight:700; text-transform:uppercase; font-size:10px; letter-spacing:1px; }
  .card-value { font-weight:800; color:#0A192F; font-size:13px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:99px; font-size:11px; font-weight:800; letter-spacing:0.5px; }
  .badge-green { background:#d1fae5; color:#065f46; }
  .badge-red { background:#fee2e2; color:#991b1b; }
  .badge-amber { background:#fef3c7; color:#92400e; }
  .cta-btn { display:block; width:fit-content; margin:24px auto 0; background:#0A192F; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:14px; font-weight:800; font-size:14px; text-align:center; }
  .cta-btn-gold { background:#F7C948; color:#0A192F; }
  .divider { height:1px; background:#f1f5f9; margin:24px 0; }
  .footer { background:#F8F9FA; border-top:1px solid #e2e8f0; padding:20px 32px; text-align:center; font-size:11px; color:#94a3b8; font-weight:600; }
  .footer a { color:#64748b; text-decoration:none; }
  .price-big { font-size:28px; font-weight:900; color:#0A192F; text-align:center; margin:16px 0 4px; }
  .price-label { font-size:11px; color:#94a3b8; font-weight:700; text-align:center; text-transform:uppercase; letter-spacing:1px; }
  .success-icon { font-size:40px; text-align:center; margin-bottom:12px; }
  .alert-box { border-radius:12px; padding:16px 20px; font-size:13px; font-weight:700; margin:16px 0; }
  .alert-box.warning { background:#fef3c7; border:1px solid #fde68a; color:#92400e; }
  .alert-box.success { background:#d1fae5; border:1px solid #6ee7b7; color:#065f46; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-logo">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7C948" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    </div>
    <div>
      <div class="header-brand">ISBAH <span>TRAVELS</span></div>
      <div class="header-tag">Premier Travel Agency · Bangladesh</div>
    </div>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Isbah Travels · Gulshan Avenue, Dhaka 1212</p>
    <p>Hotline: <a href="tel:+8801700123456">+880 1700-123456</a> · <a href="mailto:support@isbahtravels.com">support@isbahtravels.com</a></p>
    <p style="margin-top:8px;font-size:10px;">This is an automated notification. Please do not reply to this email.</p>
  </div>
</div>
</body>
</html>`;
}

function formatBDT(amount: number): string {
  return `৳ ${Number(amount).toLocaleString("en-BD")}`;
}

export function welcomeEmailTemplate(data: WelcomeEmailData): string {
  return baseLayout(`
    <div class="success-icon">✈️</div>
    <div class="greeting">Welcome aboard, ${data.user_name}!</div>
    <p class="subtext">
      Your Isbah Travels account is now active. You can now book flights, hotels, tour packages, and visa services — all in one place.
    </p>
    <div class="alert-box success">
      🎉 Your account has been successfully created with <strong>${data.user_email}</strong>
    </div>
    <div class="card">
      <div class="card-row">
        <span class="card-label">Account Email</span>
        <span class="card-value">${data.user_email}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Member Since</span>
        <span class="card-value">${new Date().toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Account Status</span>
        <span class="card-value"><span class="badge badge-green">ACTIVE</span></span>
      </div>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://isbahtravels.com"}/dashboard" class="cta-btn cta-btn-gold">
      Go to My Dashboard →
    </a>
    <div class="divider"></div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;">For support, contact us at support@isbahtravels.com or call +880 1700-123456</p>
  `);
}

export function bookingConfirmedEmailTemplate(data: BookingConfirmedEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://isbahtravels.com";
  return baseLayout(`
    <div class="success-icon">✅</div>
    <div class="greeting">Payment Confirmed!</div>
    <p class="subtext">
      Dear ${data.user_name}, your payment has been received and your booking is confirmed. Your e-ticket details are below.
    </p>
    <div class="price-big">${formatBDT(data.total_price)}</div>
    <div class="price-label">Total Amount Paid</div>
    <div class="card">
      <div class="card-row">
        <span class="card-label">Booking ID</span>
        <span class="card-value">#${data.booking_id}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Booking Type</span>
        <span class="card-value">${data.booking_type.toUpperCase()}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Description</span>
        <span class="card-value">${data.booking_title}</span>
      </div>
      ${data.transaction_id ? `<div class="card-row">
        <span class="card-label">Transaction ID</span>
        <span class="card-value">${data.transaction_id}</span>
      </div>` : ""}
      <div class="card-row">
        <span class="card-label">Payment Status</span>
        <span class="card-value"><span class="badge badge-green">PAID & CONFIRMED</span></span>
      </div>
      <div class="card-row">
        <span class="card-label">Date & Time</span>
        <span class="card-value">${new Date().toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</span>
      </div>
    </div>
    <a href="${appUrl}/dashboard" class="cta-btn cta-btn-gold">View My Booking & Download Receipt →</a>
    <div class="divider"></div>
    <div class="alert-box success">
      📄 Your PDF receipt is available for download from your dashboard. Signed URL expires in 24 hours.
    </div>
  `);
}

export function paymentFailedEmailTemplate(data: PaymentFailedEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://isbahtravels.com";
  return baseLayout(`
    <div class="success-icon">⚠️</div>
    <div class="greeting">Payment Was Not Completed</div>
    <p class="subtext">
      Dear ${data.user_name}, your payment for the booking below could not be processed. No amount has been deducted from your account.
    </p>
    <div class="card">
      <div class="card-row">
        <span class="card-label">Booking ID</span>
        <span class="card-value">#${data.booking_id}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Booking Type</span>
        <span class="card-value">${data.booking_type.toUpperCase()}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Attempted Amount</span>
        <span class="card-value">${formatBDT(data.total_price)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Status</span>
        <span class="card-value"><span class="badge badge-red">PAYMENT FAILED</span></span>
      </div>
      ${data.reason ? `<div class="card-row">
        <span class="card-label">Reason</span>
        <span class="card-value">${data.reason}</span>
      </div>` : ""}
    </div>
    <div class="alert-box warning">
      💡 Please try again with a different payment method. If the issue persists, contact our support team.
    </div>
    <a href="${appUrl}/dashboard" class="cta-btn">Retry Booking →</a>
    <div class="divider"></div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;">Need help? Contact: support@isbahtravels.com or +880 1700-123456</p>
  `);
}

export function bookingCancelledEmailTemplate(data: PaymentFailedEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://isbahtravels.com";
  return baseLayout(`
    <div class="success-icon">🚫</div>
    <div class="greeting">Booking Cancelled</div>
    <p class="subtext">
      Dear ${data.user_name}, your booking has been cancelled. If this was not intentional, please contact our team immediately.
    </p>
    <div class="card">
      <div class="card-row">
        <span class="card-label">Booking ID</span>
        <span class="card-value">#${data.booking_id}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Booking Type</span>
        <span class="card-value">${data.booking_type.toUpperCase()}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Amount</span>
        <span class="card-value">${formatBDT(data.total_price)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Status</span>
        <span class="card-value"><span class="badge badge-red">CANCELLED</span></span>
      </div>
    </div>
    <div class="alert-box warning">
      ℹ️ Refund policy: If eligible, refunds are processed within 5–7 working days to your original payment method.
    </div>
    <a href="${appUrl}/tours" class="cta-btn">Book Again →</a>
  `);
}

export function bookingStatusUpdateEmailTemplate(data: BookingStatusUpdateEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://isbahtravels.com";
  const isConfirmed = data.new_status.toLowerCase() === "confirmed";
  return baseLayout(`
    <div class="success-icon">${isConfirmed ? "🎫" : "📋"}</div>
    <div class="greeting">Booking Status Updated</div>
    <p class="subtext">
      Dear ${data.user_name}, your booking status has been updated by our team.
    </p>
    <div class="card">
      <div class="card-row">
        <span class="card-label">Booking ID</span>
        <span class="card-value">#${data.booking_id}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Description</span>
        <span class="card-value">${data.booking_title}</span>
      </div>
      <div class="card-row">
        <span class="card-label">New Status</span>
        <span class="card-value"><span class="badge ${isConfirmed ? "badge-green" : "badge-amber"}">${data.new_status.toUpperCase()}</span></span>
      </div>
      ${data.note ? `<div class="card-row">
        <span class="card-label">Note from Admin</span>
        <span class="card-value">${data.note}</span>
      </div>` : ""}
    </div>
    <a href="${appUrl}/dashboard" class="cta-btn cta-btn-gold">View My Bookings →</a>
  `);
}
