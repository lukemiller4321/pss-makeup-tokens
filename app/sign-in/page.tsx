"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, inputBase, labelBase, errorText } from "@/lib/ui";

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(
    searchParams.get("error"),
  );

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

    setStatus("sent");
  };

  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-gradient-to-br from-brand-800 to-brand-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-500">
          Parent Portal
        </p>

        {status === "sent" ? (
          <div className="mt-3 flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Check your email
            </h1>
            <p className="text-sm text-gray-600">
              We sent a magic link to {email}. Click it to sign in.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-3 text-xl font-semibold text-gray-900">
              Sign in
            </h1>
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
                {status === "sending" ? "Sending..." : "Send magic link"}
              </button>
              {error && <p className={errorText}>{error}</p>}
            </form>
          </>
        )}
      </div>
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
