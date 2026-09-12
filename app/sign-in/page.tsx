"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, inputBase, labelBase, errorText } from "@/lib/ui";

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(
    searchParams.get("error"),
  );
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }

    setStatus("idle");
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-gradient-to-br from-brand-800 to-brand-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-500">
          Parent Portal
        </p>

        <h1 className="mt-3 text-xl font-semibold text-gray-900">Sign in</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className={labelBase}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputBase}
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className={btnPrimary}
          >
            {status === "sending" ? "Sending..." : "Send sign-in link"}
          </button>
          {error && <p className={errorText}>{error}</p>}
        </form>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm text-gray-700">
              A sign-in link has been sent to your email.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className={`mt-4 ${btnPrimary}`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
