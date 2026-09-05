"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteAbsence, type DeleteAbsenceState } from "../actions";

const initialState: DeleteAbsenceState = {};

export function DeleteAbsenceForm({ absenceId }: { absenceId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteAbsence,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={absenceId} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Yes, delete this posting"}
        </button>
        <Link
          href="/admin"
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        >
          Cancel
        </Link>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
