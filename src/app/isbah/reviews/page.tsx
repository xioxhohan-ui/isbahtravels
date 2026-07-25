"use client";

import { useState } from "react";
import { MOCK_HOTEL_REVIEWS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState(MOCK_HOTEL_REVIEWS);

  const handleDelete = (id: string) => {
    if (confirm("Delete this user review?")) {
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Customer Reviews</h1>
          <p className="text-xs text-slate-500 font-semibold">Moderate, approve, or delete hotel and tour reviews.</p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">{r.user_name || "Guest"}</span>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>{r.rating} / 5</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
            </div>

            <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} className="text-rose-600 hover:bg-rose-50 rounded-xl">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

    </div>
  );
}
