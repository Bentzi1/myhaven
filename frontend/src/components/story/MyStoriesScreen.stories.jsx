import { MyStoriesScreen } from "./MyStoriesScreen"

const meta = {
  title: "Story Management/My Stories",
  component: MyStoriesScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  },
  args: {
    title: "My Stories",
    summaryCount: 3,
    supportCount: 18,
    showManagementControls: true
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
    supportCount: 0,
    stories: []
  }
}

export const Loading = {
  args: {
    busy: true
  }
}

export const ErrorState = {
  args: {
    error: "Your stories could not be loaded. Try again in a moment."
  }
}
