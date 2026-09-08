"use client";

import { useActionState } from "react";
import { issueToken, type FamilyActionState } from "./actions";
import {
  btnPrimary,
  errorText,
  fieldGroup,
  inputBase,
  labelBase,
} from "@/lib/ui";

const initialState: FamilyActionState = {};

export function IssueTokenForm({ familyId }: { familyId: string }) {
  const [state, formAction, pending] = useActionState(
    issueToken,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="familyId" value={familyId} />
      <div className={fieldGroup}>
        <label htmlFor="note" className={labelBase}>
          Reason for manual issuance (required)
        </label>
        <input
          id="note"
          type="text"
          name="note"
          required
          placeholder="e.g. goodwill token for scheduling mix-up"
          className={inputBase}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`self-start ${btnPrimary}`}
      >
        {pending ? "Issuing..." : "Issue token"}
      </button>
      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
