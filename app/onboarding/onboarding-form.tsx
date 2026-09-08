"use client";

import { useActionState, useState } from "react";
import { createFamily, type OnboardingState } from "./actions";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  errorText,
  fieldGroup,
  inputBase,
  labelBase,
} from "@/lib/ui";

const initialState: OnboardingState = {};

let nextKidId = 1;

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    createFamily,
    initialState,
  );
  const [kidIds, setKidIds] = useState<number[]>([0]);

  const addKid = () => setKidIds((ids) => [...ids, nextKidId++]);
  const removeKid = (id: number) =>
    setKidIds((ids) => (ids.length > 1 ? ids.filter((k) => k !== id) : ids));

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <h1 className="text-xl font-semibold text-gray-900">
        Set up your family
      </h1>

      <div className={fieldGroup}>
        <label htmlFor="familyName" className={labelBase}>
          Family name
        </label>
        <input
          id="familyName"
          name="familyName"
          required
          placeholder="Smith Family"
          className={inputBase}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelBase}>Kids</span>
        {kidIds.map((id, index) => (
          <div key={id} className="flex gap-2">
            <input
              name="kidName"
              required
              placeholder={`Kid ${index + 1} name`}
              className={`flex-1 ${inputBase}`}
            />
            {kidIds.length > 1 && (
              <button
                type="button"
                onClick={() => removeKid(id)}
                className={btnSecondary}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addKid} className={`self-start ${btnGhost}`}>
          + Add another kid
        </button>
      </div>

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving..." : "Finish setup"}
      </button>

      {state.error && <p className={errorText}>{state.error}</p>}
    </form>
  );
}
