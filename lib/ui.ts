// Shared className strings for the app's visual design system, matching
// the sister app (pssreports.com) — brand blue, accent orange, gray-50
// backgrounds with white cards. Applied as plain classNames rather than
// component wrappers so the same styling works identically on <button>,
// <Link>, and <a> across both Server and Client Components.

export const card =
  "rounded-xl border border-gray-200 bg-white p-6 shadow-sm";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnDestructive =
  "inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnGhost =
  "text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline";

export const btnGhostDestructive =
  "text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline";

export const btnGhostSm =
  "text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline";

export const btnGhostDestructiveSm =
  "text-xs font-medium text-red-600 transition-colors hover:text-red-700 hover:underline";

export const inputBase =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

export const labelBase = "block text-sm font-medium text-gray-700";

export const fieldGroup = "flex flex-col gap-1";

export const tableWrap =
  "overflow-hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm";

export const table = "w-full text-left text-sm";

export const theadRow = "bg-gray-50";

export const th =
  "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500";

export const tr = "border-t border-gray-100";

export const td = "px-4 py-3 text-gray-700";

export const pageWrap = "flex flex-1 flex-col items-center p-6 sm:p-10";

export const pageWrapCentered =
  "flex flex-1 flex-col items-center justify-center p-6 sm:p-10";

export const pageInner = "flex w-full flex-col gap-6";

export const pageTitle = "text-2xl font-semibold text-gray-900";

export const sectionTitle = "text-lg font-semibold text-gray-900";

export const mutedText = "text-sm text-gray-500";

export const alertSuccess =
  "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800";

export const alertWarning =
  "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800";

export const alertError =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

export const errorText = "text-sm text-red-600";
