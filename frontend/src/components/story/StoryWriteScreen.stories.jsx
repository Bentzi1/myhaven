import { StoryWriteScreen } from "./StoryWriteScreen"

const readyText = `It was a foggy day, the kind where the world feels small and quiet. I remember standing in my grandmother's kitchen, the smell of her famous recipe filling the air.

For years, I've kept this memory locked away. Not because it's sad, but because it's so incredibly precious. Sharing it here feels like finally letting out a breath I didn't know I was holding.`

const meta = {
  title: "Story Management/Write Story",
  component: StoryWriteScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  },
  args: {
    title: "New Story",
    initialValue: "",
    publishEnabled: false,
    publishBusy: false,
    checkLabel: "AI Anonymity Check"
  },
  argTypes: {
    onCancel: { action: "cancel-clicked" },
    onPublish: { action: "publish-clicked" },
    onCheckPrivacy: { action: "privacy-check-clicked" }
  }
}

export default meta

export const EmptyDraft = {}

export const ReadyToReview = {
  args: {
    initialValue: readyText,
    publishEnabled: true
  }
}
