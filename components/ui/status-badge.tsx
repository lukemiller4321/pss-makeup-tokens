const toneClasses = {
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-600",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
} as const;

export type BadgeTone = keyof typeof toneClasses;

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
