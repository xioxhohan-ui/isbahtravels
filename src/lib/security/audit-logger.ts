import { createClient } from "@/lib/supabase/client";

export interface AuditLogEntry {
  admin_id: string;
  admin_email: string;
  action: string;
  entity_type: "flight" | "hotel" | "tour" | "visa" | "booking" | "user" | "review" | "inquiry";
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
}

export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT LOG] ${timestamp} | Admin: ${entry.admin_email} | Action: ${entry.action} | Entity: ${entry.entity_type}#${entry.entity_id}`);

  try {
    const supabase = createClient();
    await supabase.from("audit_logs").insert({
      admin_id: entry.admin_id,
      admin_email: entry.admin_email,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      details: entry.details || {},
      created_at: timestamp,
    });
  } catch (err) {
    console.warn("Audit log insert fallback", err);
  }
}
