import { PhoneFrame } from "./PhoneFrame";
import { BrandMark } from "./BrandMark";

const meta = {
  title: "Onboarding/PhoneFrame",
  component: PhoneFrame,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
};

export default meta;

export const EmptyShell = {
  render: () => (
    <PhoneFrame>
      <div className="text-center text-sm text-slate-500">Story content goes here.</div>
    </PhoneFrame>
  )
};

export const WithBrandMark = {
  render: () => (
    <PhoneFrame>
      <BrandMark />
    </PhoneFrame>
  )
};
