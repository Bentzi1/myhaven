import { PencilIcon } from "./Icons";

export function BrandMark() {
  return (
    <div className="relative mb-12 flex h-48 w-48 items-center justify-center">
      <div className="animate-breathe absolute inset-0 rounded-full bg-gradient-to-tr from-[#D9E6DA] to-[#B2CFC2] blur-xl" />
      <div
        className="animate-breathe absolute inset-[12.5%] rounded-full bg-gradient-to-tr from-[#EBE3F0] to-[#B8AED0] blur-lg"
        style={{ animationDelay: "1s" }}
      />
      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
        <PencilIcon className="h-10 w-10 text-[#78A6C8]" />
      </div>
    </div>
  );
}
