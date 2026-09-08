"use client";

import { useActionState } from "react";
import { logAbsenceForExistingFamily, type LogAbsenceState } from "./actions";
import {
  btnPrimary,
  errorText,
  fieldGroup,
  inputBase,
  labelBase,
} from "@/lib/ui";

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
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="familyId" value={familyId} />

      <div className={fieldGroup}>
        <label htmlFor="childId" className={labelBase}>
          Kid
        </label>
        <select
          id="childId"
          name="childId"
          required
          defaultValue=""
          className={inputBase}
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
      </div>

      <div className={fieldGroup}>
        <label htmlFor="date" className={labelBase}>
          Date
        </label>
        <input
          id="date"
          type="date"
          name="date"
          required
          className={inputBase}
        />
      </div>

      <div className={fieldGroup}>
        <label htmlFor="time" className={labelBase}>
          Time (Pacific)
        </label>
        <input
          id="time"
          type="time"
          name="time"
          required
          className={inputBase}
        />
      </div>

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Logging..." : "Log absence"}
      </button>

      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
