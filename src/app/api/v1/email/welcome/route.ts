import { NextResponse } from "next/server";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email/send";

const schema = z.object({
  user_name: z.string().min(1),
  user_email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { user_name, user_email } = parsed.data;
    const result = await sendWelcomeEmail({ user_name, user_email });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send welcome email" }, { status: 500 });
  }
}
