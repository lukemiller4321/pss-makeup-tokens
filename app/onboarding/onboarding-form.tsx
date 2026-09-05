"use client";

import { useActionState, useState } from "react";
import { createFamily, type OnboardingState } from "./actions";

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
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Set up your family</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Family name
        </span>
        <input
          name="familyName"
          required
          placeholder="Smith Family"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Kids</span>
        {kidIds.map((id, index) => (
          <div key={id} className="flex gap-2">
            <input
              name="kidName"
              required
              placeholder={`Kid ${index + 1} name`}
              className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
            />
            {kidIds.length > 1 && (
              <button
                type="button"
                onClick={() => removeKid(id)}
                className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addKid}
          className="self-start text-sm underline"
        >
          + Add another kid
        </button>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Saving..." : "Finish setup"}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
