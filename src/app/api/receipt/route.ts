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
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF receipt", details: error?.message },
      { status: 500 }
    );
  }
}
