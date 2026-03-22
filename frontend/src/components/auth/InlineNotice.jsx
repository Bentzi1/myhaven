export function InlineNotice({ tone = "info", children }) {
  const tones = {
    info: "border-sky-100 bg-sky-50 text-sky-700",
    error: "border-rose-100 bg-rose-50 text-rose-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700"
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}
