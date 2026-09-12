"use client";

import { useActionState } from "react";
import { reportAbsence, type ReportAbsenceState } from "./actions";
import {
  btnPrimary,
  errorText,
  fieldGroup,
  inputBase,
  labelBase,
} from "@/lib/ui";

const initialState: ReportAbsenceState = {};

type Kid = { id: string; name: string };

export function ReportAbsenceForm({ kids }: { kids: Kid[] }) {
  const [state, formAction, pending] = useActionState(
    reportAbsence,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <h1 className="text-xl font-semibold text-gray-900">
        Report an absence
      </h1>

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

      <p className="text-xs text-gray-500">
        Absences reported within 12 hours of the lesson will still be listed,
        but won&apos;t earn a makeup token.
      </p>

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Reporting..." : "Report absence"}
      </button>

      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
