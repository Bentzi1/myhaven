import { GearIcon, HeartIcon, HomeIcon, PencilIcon, UserIcon } from "./StoryIcons"
import { StoryFrame } from "./StoryFrame"

const defaultStories = [
  {
    id: "foggy-day",
    title: "A foggy day",
    dateLabel: "Oct 12",
    hugsLabel: "4 Hugs received",
    gradientFrom: "#EBE3F0",
    gradientTo: "#B8AED0"
  },
  {
    id: "travel",
    title: "Travel to the coast",
    dateLabel: "Sep 28",
    hugsLabel: "12 Hugs received",
    gradientFrom: "#F2E6D8",
    gradientTo: "#C2A88F"
  },
  {
    id: "quiet-room",
    title: "The quiet room",
    dateLabel: "Aug 03",
    hugsLabel: "2 Hugs received",
    gradientFrom: "#D9E6DA",
    gradientTo: "#A3C8B0"
  }
]

function StoryCard({
  story,
  onOpenStory,
  showManagementControls,
  onEditStory,
  onDeleteStory
}) {
  return (
    <div className="mb-4 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => onOpenStory?.(story)}
        className="flex w-full gap-4 text-left transition hover:-translate-y-0.5"
      >
        <div
          className="h-16 w-16 flex-shrink-0 rounded-xl"
          style={{
            backgroundImage: `linear-gradient(135deg, ${story.gradientFrom}, ${story.gradientTo})`
          }}
        />

        <div className="flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-gray-800">{story.title}</h3>
          <p className="mt-1 text-xs text-gray-400">
            {story.dateLabel} • {story.hugsLabel}
          </p>
        </div>
      </button>

      {showManagementControls ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onEditStory?.(story)}
            className="flex-1 rounded-xl bg-[#F8F9FB] px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDeleteStory?.(story)}
            className="flex-1 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function MyStoriesScreen({
  title = "My Haven",
  summaryCount = 3,
  summaryLabel = "Stories shared safely",
  stories = defaultStories,
  busy = false,
  error = "",
  emptyStateMessage = "Your stories will appear here after you publish your first reflection.",
  showManagementControls = false,
  onSettings,
  onHome,
  onWrite,
  onOpenStory,
  onEditStory,
  onDeleteStory
}) {
  return (
    <StoryFrame>
      <div className="flex items-center justify-between px-6 pb-6 pt-12">
        <h1 className="text-3xl font-bold text-[#78A6C8]">{title}</h1>
        <button
          type="button"
          onClick={onSettings}
          className="text-[#8BB9D9] transition hover:text-[#78A6C8]"
          aria-label="Account settings"
        >
          <GearIcon />
        </button>
      </div>

      <div className="mb-6 px-6">
        <div className="flex items-center justify-between rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-800">{summaryCount}</span>
            <span className="text-xs text-gray-400">{summaryLabel}</span>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#EBE3F0] to-[#B8AED0] text-white">
            <HeartIcon className="h-6 w-6" />
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-6 mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {busy ? (
          <>
            <div className="mb-4 h-24 animate-pulse rounded-2xl bg-white/80 shadow-sm" />
            <div className="mb-4 h-24 animate-pulse rounded-2xl bg-white/80 shadow-sm" />
          </>
        ) : stories.length ? (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onOpenStory={onOpenStory}
              showManagementControls={showManagementControls}
              onEditStory={onEditStory}
              onDeleteStory={onDeleteStory}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#C8D8E6] bg-white/90 px-5 py-6 text-sm leading-6 text-slate-500 shadow-sm">
            {emptyStateMessage}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 z-10 flex w-full items-center justify-between rounded-t-3xl bg-white px-8 py-6 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={onHome}
          className="flex flex-col items-center text-[#A0C4DE]"
        >
          <HomeIcon />
          <span className="mt-1 text-xs font-medium">Home</span>
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
          className="flex flex-col items-center text-[#78A6C8]"
          aria-current="page"
        >
          <UserIcon />
          <span className="mt-1 text-xs font-semibold">My Stories</span>
        </button>
      </div>
    </StoryFrame>
  )
}
