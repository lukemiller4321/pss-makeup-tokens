import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyForUser } from "@/lib/family";
import { ReportAbsenceForm } from "./report-absence-form";

export default async function NewAbsencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const family = await getFamilyForUser(user);

  if (!family) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <ReportAbsenceForm kids={family.children} />
    </div>
  );
}
