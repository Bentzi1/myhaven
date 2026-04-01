export function joinClasses(...values) {
  return values.filter(Boolean).join(" ")
}

export function StoryFrame({
  children,
  frameClassName = "border-white bg-[#F8F9FB]",
  contentClassName = ""
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div
        className={joinClasses(
          "relative flex h-[844px] w-full max-w-[390px] overflow-hidden border-[8px] shadow-2xl sm:rounded-[40px]",
          frameClassName
        )}
      >
        <div className={joinClasses("relative flex h-full w-full flex-col", contentClassName)}>
          {children}
        </div>
      </div>
    </main>
  )
}
