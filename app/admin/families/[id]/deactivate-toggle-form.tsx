"use client";

import { useActionState } from "react";
import { toggleActive, type FamilyActionState } from "./actions";
import { errorText } from "@/lib/ui";

const initialState: FamilyActionState = {};

export function DeactivateToggleForm({
  familyId,
  active,
}: {
  familyId: string;
  active: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    toggleActive,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="familyId" value={familyId} />
      <input type="hidden" name="nextActive" value={(!active).toString()} />
      <button
        type="submit"
        disabled={pending}
        className={
          active
            ? "rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
            : "rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-50 disabled:opacity-50"
        }
      >
        {pending
          ? "Saving..."
          : active
            ? "Deactivate family"
            : "Reactivate family"}
      </button>
      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
