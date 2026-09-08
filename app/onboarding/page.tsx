import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser } from "@/lib/family";
import { OnboardingForm } from "./onboarding-form";
import { card, pageWrapCentered } from "@/lib/ui";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const family = await getFamilyForUser(user);

  if (family) {
    redirect("/");
  }

  return (
    <div className={pageWrapCentered}>
      <div className={`w-full max-w-sm ${card}`}>
        <OnboardingForm />
      </div>
    </div>
  );
}
