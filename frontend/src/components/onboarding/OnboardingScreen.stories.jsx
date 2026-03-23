import { OnboardingScreen } from "./OnboardingScreen";

const meta = {
  title: "Onboarding/OnboardingScreen",
  component: OnboardingScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  },
  args: {
    googleEnabled: true,
    message: "",
    onGoogle: undefined,
    onManual: undefined,
    onGuest: undefined
  },
  argTypes: {
    onGoogle: { action: "google-clicked" },
    onManual: { action: "manual-clicked" },
    onGuest: { action: "guest-clicked" }
  }
};

export default meta;

export const Default = {};

export const GoogleUnavailable = {
  args: {
    googleEnabled: false
  }
};

export const WithMessage = {
  args: {
    message: "Google sign-in needs local OAuth credentials first."
  }
};
