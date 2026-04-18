"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RealtimeListenerProps {
  /** Table names to subscribe to */
  tables: string[];
  /** Optional: only listen for specific events */
  events?: ("INSERT" | "UPDATE" | "DELETE")[];
}

/**
 * Subscribes to Supabase Realtime changes on the given tables
 * and triggers a Next.js router refresh to re-fetch server component data.
 */
export function RealtimeListener({
  tables,
  events = ["INSERT", "UPDATE", "DELETE"],
}: RealtimeListenerProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-${tables.join("-")}`;

    const channel = supabase.channel(channelName);

    for (const table of tables) {
      for (const event of events) {
        channel.on(
          "postgres_changes" as any,
          { event, schema: "public", table },
          () => {
            router.refresh();
          }
        );
      }
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables, events, router]);

  return null;
}
