import { GoogleIcon, MailIcon } from "./Icons";
import { ActionButton } from "./ActionButton";

const meta = {
  title: "Onboarding/ActionButton",
  component: ActionButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  },
  args: {
    children: "Enter with Email",
    variant: "primary",
    disabled: false
  },
  argTypes: {
    onClick: { action: "clicked" }
  }
};

export default meta;

export const Primary = {
  args: {
    children: "Enter with Email",
    icon: <MailIcon className="h-5 w-5" />,
    variant: "primary"
  }
};

export const Secondary = {
  args: {
    children: "Enter quietly with Google",
    icon: <GoogleIcon className="h-5 w-5" />,
    variant: "secondary"
  }
};

export const Disabled = {
  args: {
    children: "Google sign-in unavailable",
    icon: <GoogleIcon className="h-5 w-5" />,
    variant: "secondary",
    disabled: true
  }
};
