"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface DeadlineNoteProps {
  deadlineId: string;
  token: string;
  existingNote: string | null;
}

export default function DeadlineNote({
  deadlineId,
  token,
  existingNote,
}: DeadlineNoteProps) {
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
        className="t-utility !text-[12px] !text-[var(--color-ground)]  hover:text-[var(--color-mark)] mt-2 transition-colors"
      >
        + ADD NOTE
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-[var(--color-ground)] pt-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note for your client or for your records…"
        rows={2}
        maxLength={1000}
        className="t-input !text-[15px] resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="t-utility !text-[12px] ">
          {note.length}/1000
        </span>
        <button
          onClick={saveNote}
          disabled={saving || !note.trim()}
          className="btn !min-h-0 !py-2 !px-3 !text-[12px]"
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : saved ? (
            <Check className="w-3 h-3" />
          ) : null}
          {saved ? "SAVED" : "SAVE NOTE"}
        </button>
      </div>
    </div>
  );
}
