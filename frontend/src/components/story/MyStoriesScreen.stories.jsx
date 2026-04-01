import { MyStoriesScreen } from "./MyStoriesScreen"

const meta = {
  title: "Story Management/My Stories",
  component: MyStoriesScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  },
  args: {
    summaryCount: 3
  },
  argTypes: {
    onSettings: { action: "settings-clicked" },
    onHome: { action: "home-clicked" },
    onWrite: { action: "write-clicked" },
    onOpenStory: { action: "story-opened" }
  }
}

export default meta

export const Default = {}

export const Empty = {
  args: {
    summaryCount: 0,
    stories: []
  }
}
