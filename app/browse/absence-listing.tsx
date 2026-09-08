"use client";

import { useActionState, useState } from "react";
import { claimAbsence, type ClaimState } from "./actions";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";
import {
  btnPrimary,
  btnSecondary,
  card,
  errorText,
  fieldGroup,
  inputBase,
  labelBase,
} from "@/lib/ui";

const initialState: ClaimState = {};

type Kid = { id: string; name: string };

export function AbsenceListing({
  absenceId,
  date,
  kids,
  canClaim,
}: {
  absenceId: string;
  date: string;
  kids: Kid[];
  canClaim: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    claimAbsence,
    initialState,
  );

  const dateObj = new Date(date);

  return (
    <li className={`flex flex-col gap-3 ${card}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">
            {formatPacificDate(dateObj)}
          </p>
          <p className="text-sm text-gray-500">
            {formatPacificTime(dateObj)} PT
          </p>
        </div>
        {canClaim && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={btnPrimary}
          >
            Claim this slot
          </button>
        )}
      </div>

      {confirming && (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="absenceId" value={absenceId} />
          <div className={fieldGroup}>
            <label htmlFor={`childId-${absenceId}`} className={labelBase}>
              Which kid?
            </label>
            <select
              id={`childId-${absenceId}`}
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
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? "Claiming..." : "Confirm claim"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={btnSecondary}
            >
              Cancel
            </button>
          </div>
          {state.error && <p className={errorText}>{state.error}</p>}
        </form>
      )}
    </li>
  );
}
