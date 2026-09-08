"use client";

import { useActionState } from "react";
import { releaseClaimAsStaff, type ReleaseClaimState } from "./actions";
import { btnGhostDestructiveSm } from "@/lib/ui";

const initialState: ReleaseClaimState = {};

export function ReleaseClaimForm({ claimId }: { claimId: string }) {
  const [state, formAction, pending] = useActionState(
    releaseClaimAsStaff,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-start gap-1"
    >
      <input type="hidden" name="claimId" value={claimId} />
      <button
        type="submit"
        disabled={pending}
        className={`${btnGhostDestructiveSm} disabled:opacity-50`}
      >
        {pending ? "Releasing..." : "Release claim"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
