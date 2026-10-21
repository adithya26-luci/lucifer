export interface Reminder {
  id: string;
  text: string;
  remind_at: string; // ISO 8601
  delivered: boolean;
  created_at: string;
}

export interface NewReminder {
  text: string;
  remind_at: string; // ISO 8601
}

/** A reminder is due when it has not been delivered and its time has passed. */
export const isDue = (r: Pick<Reminder, "remind_at" | "delivered">, now: Date = new Date()): boolean =>
  !r.delivered && new Date(r.remind_at).getTime() <= now.getTime();

/** Upcoming reminders first (soonest to latest), delivered ones last (most recent first). */
export const sortReminders = (list: Reminder[]): Reminder[] =>
  [...list].sort((a, b) => {
    if (a.delivered !== b.delivered) return a.delivered ? 1 : -1;
    const diff = new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime();
    return a.delivered ? -diff : diff;
  });

export const formatRemindAt = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Convert a <input type="datetime-local"> value (local time, no zone) to an ISO string. */
export const localInputToIso = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Default value for a datetime-local input: now + 10 minutes, in local time. */
export const defaultLocalInput = (now: Date = new Date()): string => {
  const d = new Date(now.getTime() + 10 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
