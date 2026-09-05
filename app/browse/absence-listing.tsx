"use client";

import { useActionState, useState } from "react";
import { claimAbsence, type ClaimState } from "./actions";
import { formatPacificDate, formatPacificTime } from "@/lib/timezone";

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
    <li className="flex flex-col gap-2 rounded border border-zinc-300 p-4 dark:border-zinc-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{formatPacificDate(dateObj)}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {formatPacificTime(dateObj)} PT
          </p>
        </div>
        {canClaim && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Claim this slot
          </button>
        )}
      </div>

      {confirming && (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="absenceId" value={absenceId} />
          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Which kid?
            </span>
            <select
              name="childId"
              required
              defaultValue=""
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
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
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {pending ? "Claiming..." : "Confirm claim"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            >
              Cancel
            </button>
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </li>
  );
}
