"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useSupabaseRealtime(table: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime_${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          // Invalidate React Query cache to push real-time changes immediately
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, queryClient]);
}
