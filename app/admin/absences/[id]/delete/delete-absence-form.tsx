"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteAbsence, type DeleteAbsenceState } from "../actions";
import { btnDestructive, btnSecondary, errorText } from "@/lib/ui";

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
        <button type="submit" disabled={pending} className={btnDestructive}>
          {pending ? "Deleting..." : "Yes, delete this posting"}
        </button>
        <Link href="/admin" className={btnSecondary}>
          Cancel
        </Link>
      </div>
      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
