"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useSupabaseRealtime(
  table: string,
  queryKeyOrCallback?: string[] | (() => void),
  callback?: () => void
) {
  let queryClient: any = null;
  try {
    queryClient = useQueryClient();
  } catch {}

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime_${table}_${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        () => {
          if (typeof queryKeyOrCallback === "function") {
            queryKeyOrCallback();
          } else if (Array.isArray(queryKeyOrCallback) && queryClient) {
            queryClient.invalidateQueries({ queryKey: queryKeyOrCallback });
          }
          if (typeof callback === "function") {
            callback();
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(`isbah_${table}_updated`));
            window.dispatchEvent(new CustomEvent("isbah_data_updated"));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKeyOrCallback, callback]);
}
