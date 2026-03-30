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
