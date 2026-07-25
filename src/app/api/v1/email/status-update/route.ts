import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBookingStatusUpdateEmail } from "@/lib/email/send";

const schema = z.object({
  user_name: z.string().min(1),
  user_email: z.string().email(),
  booking_id: z.string(),
  booking_title: z.string(),
  new_status: z.string(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await sendBookingStatusUpdateEmail(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
