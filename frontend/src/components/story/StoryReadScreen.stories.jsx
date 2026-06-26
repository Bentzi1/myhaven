import { StoryReadScreen } from "./StoryReadScreen"

const meta = {
  title: "Story Management/Read Story",
  component: StoryReadScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  },
  args: {
    tag: "#memories",
    title: "A foggy day",
    metadata: "Published anonymously",
    publishedAt: "2 hours ago",
    actionLabel: "Send a Hug"
  },
  argTypes: {
    onBack: { action: "back-clicked" },
    onMenu: { action: "menu-clicked" },
    onEdit: { action: "edit-clicked" },
    onDelete: { action: "delete-clicked" },
    onSendHug: { action: "hug-clicked" }
  }
}

export default meta

export const Default = {}

export const Reflection = {
  args: {
    tag: "#healing",
    title: "The day I finally exhaled",
    publishedAt: "Yesterday",
    body: `I had been carrying the same story in my chest for years. Not because I wanted to hide, but because saying it out loud made it feel real.

This space gave me a gentler way to let it exist. I did not need to perform it. I only needed to place it somewhere safe.

That ended up being enough to make the weight feel lighter.`
  }
}

export const OwnedStory = {
  args: {
    title: "The morning I chose myself",
    metadata: "Published anonymously",
    publishedAt: "Sep 28",
    actionLabel: "12 Hugs received",
    actionDisabled: true,
    canEdit: true,
    canDelete: true,
    body: `I used to think healing had to look impressive from the outside.

That morning was smaller than that. I made tea, opened the window, and let myself admit that I wanted a kinder life.`
  }
}

export const HugSent = {
  args: {
    actionLabel: "Hug sent • 5",
    actionDisabled: true
  }
}
