export function ActionButton({
  children,
  icon,
  variant = "secondary",
  type = "button",
  disabled = false,
  onClick
}) {
  const variants = {
    primary:
      "bg-[#78A6C8] text-white shadow-[0_10px_30px_rgba(120,166,200,0.28)] hover:bg-[#6894b5]",
    secondary:
      "border border-slate-100 bg-white text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)]",
    tertiary:
      "border border-dashed border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold transition ${variants[variant]} ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
