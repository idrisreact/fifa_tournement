"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("fc25-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "fixtures" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "standings" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
