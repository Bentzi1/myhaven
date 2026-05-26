import { StoryFeedScreen } from "./StoryFeedScreen"

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

const meta = {
  title: "Story Management/Main Screen",
  component: StoryFeedScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  },
  args: {
    variant: "prototype",
    stories: prototypeStories
  },
  argTypes: {
    onOpenStory: { action: "story-opened" },
    onWrite: { action: "write-clicked" },
    onSecondaryNav: { action: "my-stories-clicked" }
  }
}

export default meta

export const HtmlPrototype = {}

export const Loading = {
  args: {
    busy: true
  }
}

export const ErrorState = {
  args: {
    error: "Stories could not be loaded. Try again in a moment."
  }
}
