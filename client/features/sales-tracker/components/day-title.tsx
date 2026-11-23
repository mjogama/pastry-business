"use client";

import { type FormEvent, useId, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api/client";
import { TITLE_MAX_LENGTH } from "../lib/validation";
import { PrimaryButton, SecondaryButton } from "./ui/buttons";
import { PopoverField } from "./ui/primitives";

interface DayTitleProps {
  title: string;
  /** Saves the title on every entry of the day; throws when a request fails. */
  onRename: (title: string) => Promise<void>;
}

/** The day's title in the day panel, edited in place. */
export const DayTitle = ({ title, onRename }: DayTitleProps) => {
  const fieldId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cancel = () => {
    setDraft(null);
    setError(null);
    inputRef.current?.blur();
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (draft === null || busy) return;
    const next = draft.trim();
    if (!next) return setError("Please add a title for this day.");
    if (next === title) return cancel();
    setBusy(true);
    setError(null);
    try {
      await onRename(next);
      setDraft(null);
      inputRef.current?.blur();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const editing = draft !== null;

  return (
    <form noValidate onSubmit={save} className="flex flex-col gap-2">
      {/* One row: the field takes all the width left; while editing, Save and Cancel sit in the right corner. */}
      <div className="flex w-full min-w-0 items-center gap-2">
        <Label htmlFor={`${fieldId}-title`} className="sr-only">
          Day title
        </Label>
        <PopoverField
          id={`${fieldId}-title`}
          ref={inputRef}
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          autoComplete="off"
          value={draft ?? title}
          onFocus={() => setDraft((current) => current ?? title)}
          // Leaving without a change drops back to plain text.
          onBlur={() => setDraft((current) => (current === title ? null : current))}
          onChange={(event) => setDraft(event.target.value)}
          // Always filled, so it reads as editable; focusing it shows Save and Cancel.
          className="w-auto min-w-0 flex-1 rounded-card bg-surface-field px-3 py-1.5 font-semibold"
        />
        {editing && (
          <div className="ml-auto flex flex-none gap-2">
            <PrimaryButton size="sm" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </PrimaryButton>
            <SecondaryButton size="sm" onClick={cancel}>
              Cancel
            </SecondaryButton>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="m-0 rounded-control bg-danger-bg px-3 py-2 text-label text-danger-alert-text">
          {error}
        </p>
      )}
    </form>
  );
};
