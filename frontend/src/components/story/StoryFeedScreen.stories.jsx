import { StoryFeedScreen } from "./StoryFeedScreen"

const communityStories = [
  {
    id: "silent-city-walk",
    title: "A silent walk in the city...",
    excerpt: "Only then did I have such a lucid moment in the city, surrounded by motion but finally able to breathe.",
    tagLabel: "#release",
    publishedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    hugCount: 8
  },
  {
    id: "grandmothers-recipe",
    title: "Cooking my grandmother's recipe...",
    excerpt: "The taste of sweetness immediately takes me back to an afternoon I thought I had forgotten.",
    tagLabel: "#memories",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    hugCount: 12
  },
  {
    id: "relaxing-day",
    title: "A relaxing day",
    excerpt: "The peaceful sound of raindrops on the window made the room feel less lonely.",
    tagLabel: "#healing",
    publishedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    hugCount: 4
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
    eyebrow: "Community",
    title: "Community stories",
    description: "Read what others have shared. Reflections you publish are kept in My Stories.",
    stories: communityStories,
    secondaryNavLabel: "My Stories"
  },
  argTypes: {
    onOpenStory: { action: "story-opened" },
    onWrite: { action: "write-clicked" },
    onSecondaryNav: { action: "my-stories-clicked" }
  }
}

export default meta

export const RegisteredCommunity = {}

export const GuestCommunity = {
  args: {
    eyebrow: "Guest session",
    description: "Read what others have shared and publish anonymously during this guest session.",
    secondaryNavDisabled: true
  }
}

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

export const Empty = {
  args: {
    stories: [],
    emptyState: "No community stories are available yet. Check back soon or share a reflection of your own."
  }
}
