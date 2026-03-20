export function ActionButton({
  children,
  icon,
  variant = "secondary",
  type = "button"
}) {
  const variants = {
    primary:
      "bg-[#78A6C8] text-white shadow-[0_10px_30px_rgba(120,166,200,0.28)] hover:bg-[#6894b5]",
    secondary:
      "border border-slate-100 bg-white text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)]"
  };

  return (
    <button
      type={type}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold transition ${variants[variant]}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
