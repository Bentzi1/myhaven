import { formatHugLabel, formatRelativeTime } from "../../lib/storyFormatting"
import { HomeIcon, PencilIcon, UserIcon } from "./StoryIcons"
import { StoryFrame } from "./StoryFrame"

function StoryCard({ story, onOpenStory }) {
  return (
    <button
      type="button"
      onClick={() => onOpenStory?.(story)}
      className="mb-4 w-full rounded-[28px] bg-white p-5 text-left shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#E2F0F9] px-3 py-1 text-[10px] font-bold text-[#6699CC]">
          {story.tagLabel || "#reflections"}
        </span>
        <span className="text-xs text-slate-400">{formatHugLabel(story.hugCount)}</span>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-slate-800">{story.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">{story.excerpt}</p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>Published anonymously</span>
        <span>{formatRelativeTime(story.publishedAt)}</span>
      </div>
    </button>
  )
}

function LoadingCard() {
  return (
    <div className="mb-4 rounded-[28px] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 h-7 w-2/3 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-5 flex justify-between">
        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  )
}

export function StoryFeedScreen({
  eyebrow = "Community",
  title = "Shared stories",
  description = "Read quietly, respond gently, and write when you are ready.",
  stories = [],
  emptyState = "No stories have been shared yet. Your reflection could be the first.",
  busy = false,
  error = "",
  secondaryNavLabel = "Guest",
  secondaryNavDisabled = false,
  onOpenStory,
  onWrite,
  onSecondaryNav,
  onLogout
}) {
  return (
    <StoryFrame>
      <div className="px-6 pb-4 pt-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#78A6C8]">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
              {title}
            </h1>
            <p className="mt-3 max-w-[240px] text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition hover:text-slate-700"
          >
            Leave
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {busy ? (
          <>
            <LoadingCard />
            <LoadingCard />
          </>
        ) : stories.length ? (
          stories.map((story) => (
            <StoryCard key={story.id} story={story} onOpenStory={onOpenStory} />
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#C8D8E6] bg-white/90 px-5 py-6 text-sm leading-6 text-slate-500 shadow-sm">
            {emptyState}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 z-10 flex w-full items-center justify-between rounded-t-3xl bg-white px-8 py-6 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <button type="button" className="flex flex-col items-center text-[#78A6C8]">
          <HomeIcon />
          <span className="mt-1 text-xs font-semibold">Home</span>
        </button>

        <button
          type="button"
          onClick={onWrite}
          className="absolute left-1/2 -top-6 flex -translate-x-1/2 flex-col items-center justify-center rounded-full border-4 border-[#F8F9FB] bg-gradient-to-br from-[#C8E0F4] to-[#9BC4E5] p-4 text-white shadow-[0_6px_16px_rgba(122,174,219,0.4)] transition hover:scale-[1.02]"
          aria-label="Write a new story"
        >
          <PencilIcon />
        </button>

        <button
          type="button"
          onClick={onSecondaryNav}
          disabled={secondaryNavDisabled}
          className={`flex flex-col items-center ${
            secondaryNavDisabled ? "text-slate-300" : "text-[#A0C4DE]"
          }`}
        >
          <UserIcon />
          <span className="mt-1 text-xs font-medium">{secondaryNavLabel}</span>
        </button>
      </div>
    </StoryFrame>
  )
}
