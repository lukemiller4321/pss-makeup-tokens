"use client";

import { useActionState } from "react";
import { createFamilyAndLogAbsence, type LogAbsenceState } from "./actions";

const initialState: LogAbsenceState = {};

export function CreateFamilyForm() {
  const [state, formAction, pending] = useActionState(
    createFamilyAndLogAbsence,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Parent email
        </span>
        <input
          type="email"
          name="email"
          required
          placeholder="parent@example.com"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Family name
        </span>
        <input
          type="text"
          name="familyName"
          required
          placeholder="Smith Family"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Kid name
        </span>
        <input
          type="text"
          name="kidName"
          required
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Date</span>
        <input
          type="date"
          name="date"
          required
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
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Creating..." : "Create family and log absence"}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
