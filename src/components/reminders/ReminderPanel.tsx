import { useState } from "react";
import { Bell, BellRing, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { defaultLocalInput, formatRemindAt, localInputToIso, type NewReminder, type Reminder } from "@/lib/reminders";

interface ReminderPanelProps {
  reminders: Reminder[];
  status: "loading" | "ready" | "unavailable";
  onAdd: (reminder: NewReminder) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const ReminderPanel = ({ reminders, status, onAdd, onDelete }: ReminderPanelProps) => {
  const [text, setText] = useState("");
  const [when, setWhen] = useState(() => defaultLocalInput());
  const [saving, setSaving] = useState(false);

  const iso = localInputToIso(when);
  const inFuture = iso !== null && new Date(iso).getTime() > Date.now();
  const canAdd = status === "ready" && text.trim().length > 0 && inFuture && !saving;

  const handleAdd = async () => {
    if (!canAdd || !iso) return;
    setSaving(true);
    const ok = await onAdd({ text: text.trim(), remind_at: iso });
    setSaving(false);
    if (ok) {
      setText("");
      setWhen(defaultLocalInput());
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-elevated p-6 mb-24" aria-label="Reminders">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Reminders</h2>
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading reminders...</span>
        </div>
      )}

      {status === "unavailable" && (
        <p className="text-sm text-muted-foreground" role="alert">
          Reminders are unavailable right now. Check that anonymous sign-ins are enabled in your Supabase Auth settings.
        </p>
      )}

      {status === "ready" && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Remind me to..."
              aria-label="Reminder text"
              className="bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
            />
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              aria-label="Reminder time"
              className="bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors sm:w-60"
            />
            <Button
              onClick={handleAdd}
              disabled={!canAdd}
              aria-label="Add reminder"
              className="bg-gradient-to-r from-primary to-crimson hover:from-primary/90 hover:to-crimson/90 shadow-glow transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reminders yet. Add one above, or just ask: "Remind me to call mom at 6pm".
            </p>
          ) : (
            <ul className="space-y-2">
              {reminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2"
                >
                  {r.delivered ? (
                    <Check className="w-4 h-4 text-muted-foreground shrink-0" aria-label="Delivered" />
                  ) : (
                    <BellRing className="w-4 h-4 text-primary shrink-0" aria-label="Upcoming" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${r.delivered ? "text-muted-foreground line-through" : ""}`}>{r.text}</p>
                    <p className="text-xs text-muted-foreground">{formatRemindAt(r.remind_at)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(r.id)}
                    aria-label={`Delete reminder: ${r.text}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
};

export default ReminderPanel;
