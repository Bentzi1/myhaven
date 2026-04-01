import { useEffect, useState } from "react"
import { SparklesIcon } from "./StoryIcons"
import { StoryFrame } from "./StoryFrame"

export function StoryWriteScreen({
  title = "New Story",
  value: controlledValue,
  initialValue = "",
  placeholder = "This is a safe space. Share what's on your mind...",
  maxLength = 1500,
  publishLabel = "Publish",
  publishEnabled = false,
  publishBusy = false,
  checkBusy = false,
  privacyMessage = "Your story will be scanned to ensure no identifying details are revealed.",
  helperTone = "muted",
  checkLabel = "AI Anonymity Check",
  onChange,
  onCancel,
  onPublish,
  onCheckPrivacy
}) {
  const [internalValue, setInternalValue] = useState(initialValue)
  const isControlled = typeof controlledValue !== "undefined"

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(initialValue)
    }
  }, [initialValue, isControlled])

  const currentValue = isControlled ? controlledValue : internalValue
  const helperStyles = {
    muted: "text-gray-400",
    success: "text-emerald-600",
    warning: "text-amber-600",
    error: "text-rose-600"
  }

  function handleChange(nextValue) {
    if (!isControlled) {
      setInternalValue(nextValue)
    }

    onChange?.(nextValue)
  }

  return (
    <StoryFrame frameClassName="border-[#FDF9F3] bg-white">
      <div className="z-10 flex items-center justify-between border-b border-[#FDF9F3] bg-white px-6 pb-4 pt-12">
        <button
          type="button"
          onClick={onCancel}
          className="text-base font-medium text-[#78A6C8] transition hover:opacity-80"
        >
          Cancel
        </button>

        <h2 className="text-lg font-bold text-gray-900">{title}</h2>

        <button
          type="button"
          onClick={onPublish}
          disabled={!publishEnabled || publishBusy}
          className={`text-base font-medium ${
            publishEnabled && !publishBusy
              ? "text-[#78A6C8] transition hover:opacity-80"
              : "cursor-not-allowed text-[#D1D5DB]"
          }`}
        >
          {publishBusy ? "Publishing..." : publishLabel}
        </button>
      </div>

      <div className="relative flex-1 bg-white p-6">
        <div className="relative flex-1 rounded-2xl bg-[#F9F7FD] p-5 shadow-inner">
          <textarea
            id="storyInput"
            value={currentValue}
            onChange={(event) => handleChange(event.target.value)}
            className="h-full min-h-[520px] w-full resize-none bg-transparent text-lg leading-relaxed text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            placeholder={placeholder}
            maxLength={maxLength}
          />

          <div className="absolute bottom-4 right-4 text-xs font-medium text-[#9CA3AF]">
            {currentValue.length} / {maxLength}
          </div>
        </div>
      </div>

      <div className="relative z-10 rounded-t-3xl bg-white px-6 pb-12 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <p className={`mb-4 px-4 text-center text-[10px] ${helperStyles[helperTone] || helperStyles.muted}`}>
          {privacyMessage}
        </p>
        <button
          type="button"
          onClick={onCheckPrivacy}
          disabled={checkBusy}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold shadow-sm transition ${
            checkBusy
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "bg-gradient-to-r from-[#D9E6DA] to-[#EBE3F0] text-[#111827] hover:opacity-90"
          }`}
        >
          <SparklesIcon className={`h-5 w-5 ${checkBusy ? "text-slate-400" : "text-[#111827]"}`} />
          {checkBusy ? "Checking..." : checkLabel}
        </button>
      </div>
    </StoryFrame>
  )
}
