import { useState } from "react"
import { BackIcon, DotsIcon, HeartIcon } from "./StoryIcons"
import { StoryFrame } from "./StoryFrame"

function getParagraphs(body) {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function StoryReadScreen({
  tag = "#memories",
  title = "A foggy day",
  metadata = "Published anonymously",
  publishedAt = "2 hours ago",
  body = `It was a foggy day, the kind where the world feels small and quiet. I remember standing in my grandmother's kitchen, the smell of her famous recipe filling the air...

For years, I've kept this memory locked away. Not because it's sad, but because it's so incredibly precious. Sharing it here feels like finally letting out a breath I didn't know I was holding.

Sometimes the safest place for a memory is out in the open, where it can float away like the fog.`,
  actionLabel = "Send a Hug",
  actionDisabled = false,
  canEdit = false,
  canDelete = false,
  onBack,
  onMenu,
  onEdit,
  onDelete,
  onSendHug
}) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const paragraphs = getParagraphs(body)
  const hasActions = Boolean(onMenu || canEdit || canDelete)

  return (
    <StoryFrame>
      <div className="flex items-center justify-between px-6 pb-4 pt-12">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[#78A6C8] transition hover:opacity-80"
        >
          <BackIcon />
          Back
        </button>

        <button
          type="button"
          onClick={() => {
            if (canEdit || canDelete) {
              setActionsOpen((current) => !current)
              return
            }

            onMenu?.()
          }}
          disabled={!hasActions}
          className={`transition ${
            hasActions
              ? "text-gray-400 hover:text-gray-600"
              : "cursor-not-allowed text-slate-200"
          }`}
          aria-label="Story actions"
          aria-expanded={actionsOpen}
        >
          <DotsIcon />
        </button>
      </div>

      {actionsOpen ? (
        <div className="absolute right-6 top-20 z-20 w-36 overflow-hidden rounded-2xl border border-slate-100 bg-white text-sm shadow-xl">
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setActionsOpen(false)
                onEdit?.()
              }}
              className="block w-full px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Edit
            </button>
          ) : null}

          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                setActionsOpen(false)
                onDelete?.()
              }}
              className="block w-full px-4 py-3 text-left font-medium text-rose-600 transition hover:bg-rose-50"
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="mb-6 mt-4">
          <div className="mb-3 w-max rounded-full bg-[#E2F0F9] px-3 py-1 text-[10px] font-bold text-[#6699CC]">
            {tag}
          </div>
          <h1 className="mb-2 text-2xl font-bold leading-tight text-gray-800">{title}</h1>
          <p className="text-xs text-gray-400">
            {metadata}
            {publishedAt ? ` • ${publishedAt}` : ""}
          </p>
        </div>

        <article className="space-y-4 text-lg leading-relaxed text-gray-600">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
      </div>

      <div className="absolute bottom-0 w-full rounded-t-3xl bg-white px-8 py-6 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={onSendHug}
          disabled={actionDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 font-medium shadow-sm transition ${
            actionDisabled
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "bg-gradient-to-r from-[#FDEAD7] to-[#F4CDB3] text-gray-800 hover:scale-[1.02]"
          }`}
        >
          <HeartIcon className={`h-5 w-5 ${actionDisabled ? "text-slate-300" : "text-red-400"}`} />
          {actionLabel}
        </button>
      </div>
    </StoryFrame>
  )
}
