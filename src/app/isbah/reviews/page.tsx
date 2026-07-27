"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/lib/services/api";
import { useSupabaseRealtime } from "@/lib/hooks/use-supabase-realtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2, Loader2, MessageSquare } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    try {
      const data = await apiService.getUserReviews();
      setReviews(data);
    } catch (err) {
      console.warn("Reviews load error", err);
    } finally {
      setLoading(false);
    }
  }

  useSupabaseRealtime("hotel_reviews", loadReviews);
  useSupabaseRealtime("tour_reviews", loadReviews);

  useEffect(() => {
    loadReviews();

    const handleUpdate = () => loadReviews();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("isbah_data_updated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("isbah_data_updated", handleUpdate);
    };
  }, []);

  const handleDelete = async (r: any) => {
    if (confirm(`Delete review for "${r.target_title || "item"}"?`)) {
      await apiService.deleteReview(r.id, r.target_type);
      setReviews((prev) => prev.filter((item) => item.id !== r.id));
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Customer Reviews ({reviews.length})</h1>
          <p className="text-xs text-slate-500 font-semibold">Moderate, approve, or delete live hotel and tour reviews from customers.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold text-xs flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
          <span>Loading Customer Reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl text-xs text-slate-500 font-semibold space-y-2">
          <MessageSquare className="h-8 w-8 text-slate-400 mx-auto" />
          <p>No customer reviews submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{r.target_title || "Verified Review"}</span>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold">{r.target_type || "Hotel"}</Badge>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold ml-2">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{r.rating} / 5</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{r.comment}</p>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>

              <Button size="sm" variant="ghost" onClick={() => handleDelete(r)} className="text-rose-600 hover:bg-rose-50 rounded-xl">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
