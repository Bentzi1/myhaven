import { formatHugLabel, formatRelativeTime } from "../../lib/storyFormatting"
import { HomeIcon, PencilIcon, UserIcon } from "./StoryIcons"
import { StoryFrame } from "./StoryFrame"

const prototypeStories = [
  {
    id: "silent-city-walk",
    title: "A silent walk in the city...",
    excerpt: "Only then did I have such a lucid moment in the city...",
    tagLabel: "Calming",
    thumbnailClassName: "from-teal-100 via-emerald-100 to-cyan-100",
    tagClassName: "border-emerald-100 bg-emerald-50 text-emerald-600"
  },
  {
    id: "grandmothers-recipe",
    title: "Cooking my grandmother's recipe...",
    excerpt: "The taste of sweetness immediately takes me back...",
    tagLabel: "Poetry",
    thumbnailClassName: "from-orange-100 via-amber-100 to-yellow-100",
    tagClassName: "border-amber-100 bg-amber-50 text-amber-600"
  },
  {
    id: "relaxing-day",
    title: "A relaxing day",
    excerpt: "The peaceful sound of raindrops on the window...",
    tagLabel: "Melancholy",
    thumbnailClassName: "from-indigo-100 via-purple-100 to-pink-100",
    tagClassName: "border-purple-100 bg-purple-50 text-purple-600"
  },
  {
    id: "travel-through",
    title: "Travel through...",
    excerpt: "Soft light and textures were easing my mind...",
    tagLabel: "Family",
    thumbnailClassName: "from-stone-200 via-orange-100 to-amber-100",
    tagClassName: "border-orange-100 bg-orange-50 text-orange-600"
  }
]

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

function SearchIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.642 10.642Z"
      />
    </svg>
  )
}

function PrototypeBrandIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white shadow-xs">
      <PencilIcon className="h-4 w-4 text-[#78A6C8]" />
    </div>
  )
}

function PrototypeStoryCard({ story, onOpenStory }) {
  return (
    <button
      type="button"
      onClick={() => onOpenStory?.(story)}
      className="flex min-h-[214px] w-full flex-col rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-xs transition duration-200 hover:-translate-y-0.5"
    >
      <div
        className={`mb-3.5 aspect-square w-full rounded-xl bg-gradient-to-tr opacity-90 ${story.thumbnailClassName}`}
      />
      <h3 className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold leading-tight text-slate-800">
        {story.title}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-snug text-slate-400">
        {story.excerpt}
      </p>
      <div className="mt-3 flex">
        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${story.tagClassName}`}
        >
          {story.tagLabel}
        </span>
      </div>
    </button>
  )
}

function PrototypeFeedScreen({
  stories = prototypeStories,
  busy = false,
  error = "",
  onOpenStory,
  onWrite,
  onSecondaryNav
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 antialiased">
      <div className="relative flex h-[780px] w-[375px] select-none flex-col overflow-hidden rounded-[48px] border-[12px] border-slate-800 bg-slate-50 p-5 shadow-[0_24px_60px_-15px_rgba(30,41,59,0.2)]">
        <div className="absolute left-1/2 top-0 z-50 flex h-6 w-36 -translate-x-1/2 items-center justify-center rounded-b-2xl bg-slate-800">
          <div className="mb-1 h-1 w-12 rounded-full bg-slate-700" />
        </div>

        <header className="flex w-full items-center justify-between pb-4 pt-6">
          <div className="flex items-center gap-2">
            <PrototypeBrandIcon />
            <h1 className="text-xl font-bold tracking-tight text-[#78A6C8]">Haven</h1>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs text-slate-400 shadow-xs transition hover:text-slate-500"
          >
            <SearchIcon />
            <span>Search</span>
          </button>
        </header>

        {error ? (
          <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pb-24 pt-2">
          {busy ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="min-h-[214px] animate-pulse rounded-2xl border border-slate-100 bg-white p-3 shadow-xs"
              >
                <div className="aspect-square w-full rounded-xl bg-slate-100" />
                <div className="mt-3.5 h-3 rounded-full bg-slate-100" />
                <div className="mt-2 h-3 w-4/5 rounded-full bg-slate-100" />
                <div className="mt-3 h-4 w-14 rounded-full bg-slate-100" />
              </div>
            ))
          ) : (
            stories.map((story) => (
              <PrototypeStoryCard key={story.id} story={story} onOpenStory={onOpenStory} />
            ))
          )}
        </section>

        <nav className="absolute bottom-5 left-5 right-5 flex h-16 items-center justify-around rounded-2xl border border-slate-100 bg-white/90 px-4 shadow-lg backdrop-blur-md">
          <button type="button" className="flex flex-col items-center gap-0.5 text-[#78A6C8]">
            <HomeIcon className="h-5 w-5" />
            <span className="text-[9px] font-bold">Home</span>
          </button>

          <button
            type="button"
            onClick={onWrite}
            className="absolute left-1/2 -top-5 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-tr from-[#78A6C8] to-[#93b9d5] text-white shadow-md shadow-blue-200 transition active:scale-95"
            aria-label="Write a new story"
          >
            <PencilIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onSecondaryNav}
            className="flex flex-col items-center gap-0.5 text-slate-400 transition hover:text-slate-500"
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-[9px] font-bold">My Stories</span>
          </button>
        </nav>

        <div className="absolute bottom-1 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-slate-800" />
      </div>
    </main>
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
  variant = "default",
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
  if (variant === "prototype") {
    return (
      <PrototypeFeedScreen
        stories={stories.length ? stories : prototypeStories}
        busy={busy}
        error={error}
        onOpenStory={onOpenStory}
        onWrite={onWrite}
        onSecondaryNav={onSecondaryNav}
      />
    )
  }

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
