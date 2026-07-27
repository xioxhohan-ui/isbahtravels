import { apiService } from "@/lib/services/api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("booking_id") || "bk-1001";
  const download = searchParams.get("download") === "true";

  const bookings = await apiService.getBookings();
  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];

  try {
    // Dynamic import to avoid issues with React 19 + @react-pdf/renderer compatibility
    const pdfModule = await import("@react-pdf/renderer");
    const { ReceiptDocument } = await import("@/lib/pdf/receipt-document");
    const React = await import("react");

    const pdfBuffer = await pdfModule.renderToBuffer(
      React.createElement(ReceiptDocument, { booking }) as any
    );

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="isbah-receipt-${booking.id}.pdf"`
    );

    return new NextResponse(new Uint8Array(pdfBuffer), { headers });
  } catch (error: any) {
    console.error("PDF generation error, fallback to printable HTML:", error);

    const customerName = booking.details?.customer_name || booking.details?.lead_passenger || "Customer";
    const customerEmail = booking.details?.customer_email || booking.details?.email || "customer@example.com";
    const customerPhone = booking.details?.customer_phone || booking.details?.phone || "+880 1711-998877";
    const title = booking.details?.title || booking.details?.airline || `${booking.booking_type.toUpperCase()} Booking`;
    const travelDate = booking.details?.travel_date || new Date(booking.created_at).toLocaleDateString();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Isbah Travels Official Receipt - ${booking.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #047857; padding-bottom: 16px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 900; color: #0f172a; }
            .logo-accent { color: #047857; }
            .badge { background: #d1fae5; color: #065f46; font-size: 12px; font-weight: bold; padding: 6px 12px; border-radius: 20px; }
            .grid { display: flex; gap: 20px; margin-bottom: 24px; }
            .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; }
            .card h4 { margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .card p { margin: 4px 0; font-size: 13px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .table th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; }
            .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total-box { background: #0f172a; color: #fff; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
            .total-amount { font-size: 24px; font-weight: bold; color: #34d399; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div className="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #047857; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
              🖨️ Print / Save as PDF
            </button>
          </div>

          <div class="header">
            <div>
              <div class="logo">ISBAH <span class="logo-accent">TRAVELS</span></div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Official Payment Invoice & E-Ticket</div>
            </div>
            <div class="badge">PAID • VERIFIED RECEIPT</div>
          </div>

          <div class="grid">
            <div class="card">
              <h4>Customer Details</h4>
              <p>${customerName}</p>
              <p style="color: #047857;">Mobile Phone: ${customerPhone}</p>
              <p>Email: ${customerEmail}</p>
            </div>
            <div class="card">
              <h4>Booking Reference</h4>
              <p>Booking ID: #${booking.id}</p>
              <p>Service Type: ${booking.booking_type.toUpperCase()}</p>
              <p>Date: ${travelDate}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Travel Date</th>
                <th style="text-align: right;">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${title}</strong></td>
                <td>${travelDate}</td>
                <td style="text-align: right;"><strong>৳${booking.total_price.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8;">Total Paid Amount</div>
              <div class="total-amount">৳${booking.total_price.toLocaleString()} BDT</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              Payment Method: ${booking.payment_details?.method || "SSLCommerz Online Payment"}
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Isbah Travels Ltd. • Civil Aviation Authorized Travel Agency<br/>
            Suite 402, Main Gulshan Avenue, Dhaka-1212, Bangladesh • Hotline: +880 1700-123456
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
