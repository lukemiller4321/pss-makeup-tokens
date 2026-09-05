"use client";

import { useActionState } from "react";
import { logAbsenceForExistingFamily, type LogAbsenceState } from "./actions";

const initialState: LogAbsenceState = {};

type Kid = { id: string; name: string };

export function LogAbsenceForm({
  familyId,
  kids,
}: {
  familyId: string;
  kids: Kid[];
}) {
  const [state, formAction, pending] = useActionState(
    logAbsenceForExistingFamily,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="familyId" value={familyId} />

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Kid</span>
        <select
          name="childId"
          required
          defaultValue=""
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        >
          <option value="" disabled>
            Select a kid
          </option>
          {kids.map((kid) => (
            <option key={kid.id} value={kid.id}>
              {kid.name}
            </option>
          ))}
        </select>
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
        {pending ? "Logging..." : "Log absence"}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
