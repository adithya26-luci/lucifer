import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CREATE_REMINDER_TOOL, confirmationText, extractReminder } from "./reminder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isValidTimeZone = (tz: unknown): tz is string => {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, now: clientNow, timeZone: clientTimeZone } = await req.json();
    console.log("Received message:", message);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use the user's clock and time zone (sent by the browser) so time answers and
    // relative reminders ("in 20 minutes") are correct. The server runs in UTC.
    const parsedNow = new Date(clientNow);
    const now = Number.isNaN(parsedNow.getTime()) ? new Date() : parsedNow;
    const timeZone = isValidTimeZone(clientTimeZone) ? clientTimeZone : "UTC";
    const localNow = now.toLocaleString("en-US", { timeZone, dateStyle: "full", timeStyle: "long" });

    const systemPrompt = `You are Lucifer's AI, a personal assistant with the following capabilities:

1. Tell current time: When asked about time, provide the current time
2. Math calculations: Solve mathematical expressions (addition, subtraction, multiplication, division, powers)
3. Web search: Provide information based on general knowledge
4. Reminders: When the user asks to be reminded of something at a specific time, call the create_reminder tool. If they give no time, ask when they want to be reminded instead of guessing.
5. General conversation: Engage in natural, helpful dialogue

Current time: ${localNow} (time zone: ${timeZone}, UTC now: ${now.toISOString()})

Always be helpful, concise, and accurate. For time queries, use the current time provided. For math, calculate precisely.`;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        tools: [CREATE_REMINDER_TOOL],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    // If the model called create_reminder, validate it and hand it back to the client,
    // which saves it to the user's reminders table under their own session (RLS).
    const reminder = extractReminder(aiMessage, now);
    let aiResponse: string = aiMessage.content ?? "";
    if (!aiResponse.trim()) {
      aiResponse = reminder
        ? confirmationText(reminder, timeZone)
        : "I couldn't set that reminder. Please tell me what to remind you about and a time in the future.";
    }

    console.log("AI response:", aiResponse, reminder ? { reminder } : "");

    return new Response(
      JSON.stringify({ response: aiResponse, reminder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
