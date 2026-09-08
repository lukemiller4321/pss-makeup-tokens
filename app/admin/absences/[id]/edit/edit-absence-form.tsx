"use client";

import { useActionState } from "react";
import { updateAbsence, type EditAbsenceState } from "../actions";
import {
  btnPrimary,
  errorText,
  fieldGroup,
  inputBase,
  labelBase,
} from "@/lib/ui";

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

      <div className={fieldGroup}>
        <label htmlFor="date" className={labelBase}>
          Date
        </label>
        <input
          id="date"
          type="date"
          name="date"
          required
          defaultValue={defaultDate}
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
          defaultValue={defaultTime}
          className={inputBase}
        />
      </div>

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving..." : "Save changes"}
      </button>

      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
