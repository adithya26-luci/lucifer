import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isDue, sortReminders, type NewReminder, type Reminder } from "@/lib/reminders";

const CHECK_INTERVAL_MS = 10_000;

interface UseRemindersOptions {
  /** Called when a reminder comes due, e.g. to speak it aloud. */
  onDue?: (reminder: Reminder) => void;
}

/**
 * Reminders backed by the Supabase `reminders` table (per-user via row-level security).
 * Users are signed in anonymously so each browser gets its own private list.
 * Due reminders fire while the app is open (no background push).
 */
export function useReminders({ onDue }: UseRemindersOptions = {}) {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const firedRef = useRef<Set<string>>(new Set());
  const onDueRef = useRef(onDue);
  onDueRef.current = onDue;

  // Ensure a session (anonymous if needed), then load this user's reminders.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        let uid = sessionData.session?.user.id ?? null;
        if (!uid) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          uid = data.user?.id ?? null;
        }
        if (!uid) throw new Error("No user session");

        const { data: rows, error } = await supabase
          .from("reminders")
          .select("id, text, remind_at, delivered, created_at")
          .order("remind_at", { ascending: true });
        if (error) throw error;

        if (!cancelled) {
          setUserId(uid);
          setReminders(rows ?? []);
          setStatus("ready");
        }
      } catch (err) {
        console.error("Reminders unavailable:", err);
        if (!cancelled) setStatus("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addReminder = useCallback(
    async ({ text, remind_at }: NewReminder) => {
      if (!userId) {
        toast({
          title: "Reminders unavailable",
          description: "Couldn't start a session. Enable anonymous sign-ins in Supabase Auth.",
          variant: "destructive",
        });
        return false;
      }
      const { data, error } = await supabase
        .from("reminders")
        .insert({ user_id: userId, text, remind_at })
        .select("id, text, remind_at, delivered, created_at")
        .single();
      if (error || !data) {
        console.error("Failed to save reminder:", error);
        toast({ title: "Couldn't save reminder", description: error?.message, variant: "destructive" });
        return false;
      }
      setReminders((prev) => [...prev, data]);
      return true;
    },
    [userId, toast]
  );

  const deleteReminder = useCallback(async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete reminder:", error);
      return;
    }
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Fire due reminders while the app is open.
  useEffect(() => {
    if (status !== "ready") return;

    const check = async () => {
      const due = reminders.filter((r) => isDue(r) && !firedRef.current.has(r.id));
      for (const r of due) {
        firedRef.current.add(r.id);
        toast({ title: "Reminder", description: r.text });
        onDueRef.current?.(r);
        const { error } = await supabase.from("reminders").update({ delivered: true }).eq("id", r.id);
        if (error) {
          console.error("Failed to mark reminder delivered:", error);
        } else {
          setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, delivered: true } : x)));
        }
      }
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reminders, status, toast]);

  return { reminders: sortReminders(reminders), status, addReminder, deleteReminder };
}
