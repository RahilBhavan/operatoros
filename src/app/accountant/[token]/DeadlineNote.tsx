"use client";

import { useState } from "react";
import { MessageSquare, Check, Loader2 } from "lucide-react";

interface DeadlineNoteProps {
  deadlineId: string;
  token: string;
  existingNote: string | null;
}

export default function DeadlineNote({ deadlineId, token, existingNote }: DeadlineNoteProps) {
  const [open, setOpen] = useState(!!existingNote);
  const [note, setNote] = useState(existingNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveNote() {
    if (!note.trim()) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/accountant/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, deadlineId, note }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-1 transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        Add note
      </button>
    );
  }

  return (
    <div className="mt-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note for your client or for your records…"
        rows={2}
        maxLength={1000}
        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder:text-slate-300 resize-none"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-300">{note.length}/1000</span>
        <button
          onClick={saveNote}
          disabled={saving || !note.trim()}
          className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 py-1 rounded-lg font-medium transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : saved ? (
            <Check className="w-3 h-3" />
          ) : null}
          {saved ? "Saved" : "Save note"}
        </button>
      </div>
    </div>
  );
}
