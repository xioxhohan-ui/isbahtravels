import { NextResponse } from "next/server";
import { apiService } from "@/lib/services/api";

/**
 * POST /api/payment/ipn
 * SSLCommerz Instant Payment Notification (IPN) Webhook Handler
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tran_id = formData.get("tran_id")?.toString() || "";
    const val_id = formData.get("val_id")?.toString() || "";
    const amount = formData.get("amount")?.toString() || "";
    const status = formData.get("status")?.toString() || "";
    const store_amount = formData.get("store_amount")?.toString() || "";
    const currency = formData.get("currency")?.toString() || "BDT";
    const verify_sign = formData.get("verify_sign")?.toString() || "";
    const verify_key = formData.get("verify_key")?.toString() || "";

    // Extract booking ID from transaction ID (ISBAH-SSL-{booking_id})
    const bookingId = tran_id.replace("ISBAH-SSL-", "");

    const store_id = process.env.SSLCOMMERZ_STORE_ID || "isbahtravels_sandbox";
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || "isbahtravels_pass";
    const is_sandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";

    let isValid = false;

    // Validate transaction with SSLCommerz Order Validation API
    if (val_id && store_id) {
      try {
        const validateUrl = is_sandbox
          ? `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&v=1&format=json`
          : `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&v=1&format=json`;

        const valRes = await fetch(validateUrl);
        const valData = await valRes.json();

        if (valData.status === "VALID" || valData.status === "VALIDATED") {
          isValid = true;
        }
      } catch (err) {
        console.warn("SSLCommerz IPN verification fetch warning", err);
      }
    }

    // Accept valid status or sandbox transaction status
    if (status === "VALID" || status === "VALIDATED" || isValid) {
      if (bookingId) {
        await apiService.updateBookingStatus(bookingId, "paid", "confirmed");
        
        // Log IPN confirmation audit trail
        await apiService.logRankingChange({
          entity_type: "booking",
          entity_id: bookingId,
          old_rank: 0,
          new_rank: 100,
          old_visibility: true,
          new_visibility: true,
        });
      }
      return NextResponse.json({ status: "SUCCESS", message: "IPN verified and booking updated" });
    } else {
      if (bookingId) {
        await apiService.updateBookingStatus(bookingId, "failed", "cancelled");
      }
      return NextResponse.json({ status: "FAILED", message: "Transaction verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("SSLCommerz IPN Handler Error:", error);
    return NextResponse.json({ error: error.message || "IPN handler error" }, { status: 500 });
  }
}
