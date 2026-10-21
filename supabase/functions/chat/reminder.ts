// Pure helpers for the chat function's reminder tool. No Deno-specific APIs,
// so they can be unit tested outside the Supabase runtime.

export const CREATE_REMINDER_TOOL = {
  type: "function",
  function: {
    name: "create_reminder",
    description:
      "Create a reminder when the user asks to be reminded of something at a specific time. " +
      "Resolve relative times (e.g. 'in 20 minutes', 'tomorrow at 9am') using the current time given in the system prompt.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "What to remind the user about, e.g. 'Call mom'." },
        remind_at: {
          type: "string",
          description: "When to remind, as an ISO 8601 timestamp including the UTC offset, e.g. 2026-10-22T09:00:00+05:30.",
        },
      },
      required: ["text", "remind_at"],
      additionalProperties: false,
    },
  },
} as const;

export interface ParsedReminder {
  text: string;
  remind_at: string; // normalized to UTC ISO
}

/** Validate the model's tool call arguments. Returns null if unusable. */
export function parseReminderArgs(rawArgs: unknown, now: Date = new Date()): ParsedReminder | null {
  let args: unknown = rawArgs;
  if (typeof rawArgs === "string") {
    try {
      args = JSON.parse(rawArgs);
    } catch {
      return null;
    }
  }
  if (!args || typeof args !== "object") return null;

  const { text, remind_at } = args as { text?: unknown; remind_at?: unknown };
  if (typeof text !== "string" || typeof remind_at !== "string") return null;

  const cleanText = text.trim().slice(0, 500);
  const when = new Date(remind_at);
  if (!cleanText || Number.isNaN(when.getTime())) return null;
  if (when.getTime() <= now.getTime()) return null; // must be in the future

  return { text: cleanText, remind_at: when.toISOString() };
}

/** Pull the create_reminder call (if any) out of an OpenAI-style chat completion message. */
export function extractReminder(message: any, now: Date = new Date()): ParsedReminder | null {
  const calls = message?.tool_calls;
  if (!Array.isArray(calls)) return null;
  const call = calls.find((c: any) => c?.function?.name === "create_reminder");
  return call ? parseReminderArgs(call.function.arguments, now) : null;
}

export function confirmationText(r: ParsedReminder, timeZone?: string): string {
  let when: string;
  try {
    when = new Date(r.remind_at).toLocaleString("en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    when = new Date(r.remind_at).toISOString();
  }
  return `Okay, I'll remind you to ${r.text} on ${when}.`;
}
