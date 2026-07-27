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
 * PATCH /api/v1/admin/[entity]/[id]/rank
 * Body: { star_rank?: number, admin_rank?: number }
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
    const star_rank = typeof body.star_rank === "number" ? body.star_rank : 0;
    const admin_rank = typeof body.admin_rank === "number" ? body.admin_rank : 50;
    const display_order = (star_rank * 1000) + admin_rank;

    const supabase = await getSupabaseServer();
    
    // Fetch old record for audit logging
    const { data: oldData } = await supabase.from(entity).select("*").eq("id", id).single();
    const old_rank = oldData?.display_order || 0;

    const { data, error } = await supabase
      .from(entity)
      .update({
        star_rank,
        admin_rank,
        rank_priority: admin_rank,
        is_starred: star_rank > 0,
        display_order,
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
        old_rank,
        new_rank: display_order,
        old_visibility: oldData?.show_on_homepage !== false,
        new_visibility: oldData?.show_on_homepage !== false,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, data: data?.[0], display_order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
