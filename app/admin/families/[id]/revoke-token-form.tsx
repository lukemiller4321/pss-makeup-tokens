"use client";

import { useActionState } from "react";
import { revokeToken, type FamilyActionState } from "./actions";
import { btnGhostDestructiveSm } from "@/lib/ui";

const initialState: FamilyActionState = {};

export function RevokeTokenForm({
  tokenId,
  familyId,
}: {
  tokenId: string;
  familyId: string;
}) {
  const [state, formAction, pending] = useActionState(
    revokeToken,
    initialState,
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="tokenId" value={tokenId} />
      <input type="hidden" name="familyId" value={familyId} />
      <button
        type="submit"
        disabled={pending}
        className={`${btnGhostDestructiveSm} disabled:opacity-50`}
      >
        {pending ? "Revoking..." : "Revoke"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
