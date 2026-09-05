"use client";

import { useActionState } from "react";
import { updateAbsence, type EditAbsenceState } from "../actions";

const initialState: EditAbsenceState = {};

export function EditAbsenceForm({
  absenceId,
  defaultDate,
  defaultTime,
}: {
  absenceId: string;
  defaultDate: string;
  defaultTime: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateAbsence,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={absenceId} />

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Date</span>
        <input
          type="date"
          name="date"
          required
          defaultValue={defaultDate}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Time (Pacific)
        </span>
        <input
          type="time"
          name="time"
          required
          defaultValue={defaultTime}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
