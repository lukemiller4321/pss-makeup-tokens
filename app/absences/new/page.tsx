import { requireActiveFamily } from "@/lib/family";
import { ReportAbsenceForm } from "./report-absence-form";
import { card, pageWrapCentered } from "@/lib/ui";

export default async function NewAbsencePage() {
  const family = await requireActiveFamily();

  return (
    <div className={pageWrapCentered}>
      <div className={`w-full max-w-sm ${card}`}>
        <ReportAbsenceForm kids={family.children} />
      </div>
    </div>
  );
}
