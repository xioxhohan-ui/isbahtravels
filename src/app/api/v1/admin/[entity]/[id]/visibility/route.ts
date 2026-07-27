import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

/**
 * PATCH /api/v1/admin/[entity]/[id]/visibility
 * Body: { show_on_homepage: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    const { entity, id } = await params;
    const allowed = ["flights", "hotels", "tours", "visas", "bookings"];
    if (!allowed.includes(entity)) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    const body = await request.json();
    const show_on_homepage = Boolean(body.show_on_homepage);

    const supabase = await getSupabaseServer();
    
    // Fetch old record for audit logging
    const { data: oldData } = await supabase.from(entity).select("*").eq("id", id).single();
    const old_visibility = oldData?.show_on_homepage !== false;

    const { data, error } = await supabase
      .from(entity)
      .update({
        show_on_homepage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert ranking_log entry
    const singularEntity = entity.endsWith("s") ? entity.slice(0, -1) : entity;
    await supabase.from("ranking_logs").insert([
      {
        entity_type: singularEntity,
        entity_id: id,
        old_rank: oldData?.display_order || 0,
        new_rank: oldData?.display_order || 0,
        old_visibility,
        new_visibility: show_on_homepage,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, data: data?.[0], show_on_homepage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
