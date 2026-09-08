"use client";

import { useActionState } from "react";
import { mergeFamilies, type FamilyActionState } from "../actions";
import { btnDestructive, errorText } from "@/lib/ui";

const initialState: FamilyActionState = {};

export function MergeConfirmForm({
  keepId,
  duplicateId,
}: {
  keepId: string;
  duplicateId: string;
}) {
  const [state, formAction, pending] = useActionState(
    mergeFamilies,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="keepId" value={keepId} />
      <input type="hidden" name="duplicateId" value={duplicateId} />
      <button
        type="submit"
        disabled={pending}
        className={`self-start ${btnDestructive}`}
      >
        {pending ? "Merging..." : "Yes, merge and delete the duplicate"}
      </button>
      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
