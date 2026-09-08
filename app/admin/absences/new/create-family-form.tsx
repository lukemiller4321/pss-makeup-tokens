"use client";

import { useActionState } from "react";
import { createFamilyAndLogAbsence, type LogAbsenceState } from "./actions";
import {
  btnPrimary,
  errorText,
  fieldGroup,
  inputBase,
  labelBase,
} from "@/lib/ui";

const initialState: LogAbsenceState = {};

export function CreateFamilyForm() {
  const [state, formAction, pending] = useActionState(
    createFamilyAndLogAbsence,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className={fieldGroup}>
        <label htmlFor="email" className={labelBase}>
          Parent email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          placeholder="parent@example.com"
          className={inputBase}
        />
      </div>

      <div className={fieldGroup}>
        <label htmlFor="familyName" className={labelBase}>
          Family name
        </label>
        <input
          id="familyName"
          type="text"
          name="familyName"
          required
          placeholder="Smith Family"
          className={inputBase}
        />
      </div>

      <div className={fieldGroup}>
        <label htmlFor="kidName" className={labelBase}>
          Kid name
        </label>
        <input
          id="kidName"
          type="text"
          name="kidName"
          required
          className={inputBase}
        />
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
        {pending ? "Creating..." : "Create family and log absence"}
      </button>

      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
